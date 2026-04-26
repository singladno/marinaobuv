import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/server/db';
import { logServerError, logger } from '@/lib/server/logger';

import { touchSupplierPollInbound } from './supplier-poll-chat-state';
import {
  supplierPollRunGptInclude,
  runSupplierPollGptForChat,
  type SupplierPollRunForGpt,
} from './run-supplier-poll-gpt-for-chat';

/** Опционально: мс ожидания перед GPT; если за это время пришёл более новый триггер по тому же run — этот пропускаем (серии фото/стикеров). 0 = выкл. */
function gptDebounceMs(): number {
  const raw = process.env.SUPPLIER_POLL_GPT_DEBOUNCE_MS;
  if (raw == null || raw === '') return 0;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 30_000) : 0;
}

function isPrismaUniqueViolation(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'
  );
}

function waBigintTsToDate(ts: bigint): Date {
  const n = Number(ts);
  return new Date(n > 1e12 ? n : n * 1000);
}

export async function processSupplierPollAfterWaMessage(params: {
  chatId: string;
  waMessageId: string;
}): Promise<void> {
  const trigger = await prisma.waAdminMessage.findUnique({
    where: { waMessageId: params.waMessageId },
    select: { isFromMe: true },
  });
  if (trigger?.isFromMe) {
    logger.debug(
      '[supplier-poll] skip: trigger is outgoing (avoids re-entry loop)'
    );
    return;
  }

  const runs = await prisma.supplierPollRun.findMany({
    where: {
      status: 'IN_PROGRESS',
      waMessages: { some: { chatId: params.chatId } },
    },
    include: supplierPollRunGptInclude,
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  if (runs.length === 0) return;

  for (const run of runs) {
    try {
      await processOneRun({
        run,
        chatId: params.chatId,
        triggerWaMessageId: params.waMessageId,
      });
    } catch (e) {
      logServerError('[supplier-poll] process run failed:', e);
    }
  }
}

async function processOneRun(params: {
  run: SupplierPollRunForGpt;
  chatId: string;
  triggerWaMessageId: string;
}): Promise<void> {
  const { run, chatId, triggerWaMessageId } = params;

  let triggerCreatedAt: Date;
  try {
    const created = await prisma.supplierPollGptTrigger.create({
      data: {
        pollRunId: run.id,
        triggerWaMessageId,
      },
      select: { createdAt: true },
    });
    triggerCreatedAt = created.createdAt;
  } catch (e) {
    if (isPrismaUniqueViolation(e)) {
      return;
    }
    throw e;
  }

  const debounceMs = gptDebounceMs();
  if (debounceMs > 0) {
    await new Promise<void>(resolve => {
      setTimeout(resolve, debounceMs);
    });
    const newer = await prisma.supplierPollGptTrigger.findFirst({
      where: {
        pollRunId: run.id,
        createdAt: { gt: triggerCreatedAt },
      },
      select: { id: true },
    });
    if (newer) {
      logger.debug(
        '[supplier-poll] skip: superseded by newer GPT trigger (debounce)'
      );
      return;
    }
  }

  const msg = await prisma.waAdminMessage.findUnique({
    where: { waMessageId: triggerWaMessageId },
    select: { timestamp: true },
  });
  if (msg) {
    await touchSupplierPollInbound({
      pollRunId: run.id,
      chatId,
      at: waBigintTsToDate(msg.timestamp),
    });
  }

  await runSupplierPollGptForChat({ run, chatId, trigger: 'webhook' });
}
