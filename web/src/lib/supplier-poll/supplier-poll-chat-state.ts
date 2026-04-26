import { prisma } from '@/lib/server/db';

/**
 * Stale @prisma/client (before `npx prisma generate` after adding SupplierPollChatState) leaves
 * `prisma.supplierPollChatState` undefined at runtime and breaks webhooks.
 */
function supplierPollChatStateTable() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (prisma as any).supplierPollChatState;
  if (t == null) {
    throw new Error(
      'Prisma client has no model supplierPollChatState. In web/: `npx prisma generate`, then `npx prisma db push` (or migrate) if the table is missing, then restart Next (`rm -rf .next` if the error persists).'
    );
  }
  return t;
}

export function supplierPollScheduledGapMs(): number {
  const raw = process.env.SUPPLIER_POLL_SCHEDULED_GAP_MINUTES;
  if (raw == null || raw === '') return 10 * 60_000;
  const n = Number.parseInt(raw, 10);
  const mins = Number.isFinite(n) && n > 0 ? Math.min(n, 24 * 60) : 10;
  return mins * 60_000;
}

/**
 * Inbound from supplier: updates last message time (webhook path).
 */
export async function touchSupplierPollInbound(p: {
  pollRunId: string;
  chatId: string;
  at: Date;
}): Promise<void> {
  const table = supplierPollChatStateTable();
  const existing = await table.findUnique({
    where: {
      pollRunId_chatId: { pollRunId: p.pollRunId, chatId: p.chatId },
    },
    select: { lastSupplierInboundAt: true },
  });
  const next =
    !existing?.lastSupplierInboundAt || p.at > existing.lastSupplierInboundAt
      ? p.at
      : existing.lastSupplierInboundAt;
  await table.upsert({
    where: {
      pollRunId_chatId: { pollRunId: p.pollRunId, chatId: p.chatId },
    },
    create: {
      pollRunId: p.pollRunId,
      chatId: p.chatId,
      lastSupplierInboundAt: next,
    },
    update: { lastSupplierInboundAt: next },
  });
}

/**
 * After scheduled cron actually sent a WhatsApp message to the supplier.
 */
export async function markSchedulerFollowupSent(p: {
  pollRunId: string;
  chatId: string;
  at: Date;
}): Promise<void> {
  const table = supplierPollChatStateTable();
  await table.upsert({
    where: {
      pollRunId_chatId: { pollRunId: p.pollRunId, chatId: p.chatId },
    },
    create: {
      pollRunId: p.pollRunId,
      chatId: p.chatId,
      lastSchedulerFollowupSentAt: p.at,
    },
    update: { lastSchedulerFollowupSentAt: p.at },
  });
}

export type ScheduledFollowupEligibility = {
  eligible: boolean;
  /** Human-readable reason (RU) for cron / ops */
  detail: string;
};

/**
 * - At least GAP after last supplier inbound
 * - If we already sent a scheduled nudge and the supplier has not sent anything since, wait (no second nudge)
 */
export async function getScheduledFollowupEligibility(
  pollRunId: string,
  chatId: string,
  now: Date
): Promise<ScheduledFollowupEligibility> {
  const table = supplierPollChatStateTable();
  const state = await table.findUnique({
    where: {
      pollRunId_chatId: { pollRunId, chatId },
    },
  });
  if (!state?.lastSupplierInboundAt) {
    return {
      eligible: false,
      detail:
        'нет записи о входящем от поставщика по этому чату (state.lastSupplierInboundAt) — ждём первое сообщение или webhook',
    };
  }
  const gap = supplierPollScheduledGapMs();
  const gapMin = Math.round(gap / 60_000);
  const elapsed = now.getTime() - state.lastSupplierInboundAt.getTime();
  if (elapsed < gap) {
    const needSec = Math.ceil((gap - elapsed) / 1000);
    return {
      eligible: false,
      detail: `интервал ${gapMin} мин после последнего входящего от поставщика не вышел; осталось ~${needSec} с`,
    };
  }
  if (
    state.lastSchedulerFollowupSentAt != null &&
    state.lastSchedulerFollowupSentAt.getTime() >
      state.lastSupplierInboundAt.getTime()
  ) {
    return {
      eligible: false,
      detail:
        'плановое напоминание уже отправляли после последнего ответа поставщика — ждём новое входящее',
    };
  }
  return { eligible: true, detail: 'ок' };
}

export async function isEligibleForScheduledFollowup(
  pollRunId: string,
  chatId: string,
  now: Date
): Promise<boolean> {
  const r = await getScheduledFollowupEligibility(pollRunId, chatId, now);
  return r.eligible;
}
