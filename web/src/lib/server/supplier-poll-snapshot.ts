import { SupplierPollRunStatus, type Prisma } from '@prisma/client';

import type {
  SupplierPollItemStatus,
  SupplierPollSnapshot,
} from '@/lib/supplier-poll-types';
import { prisma } from '@/lib/server/db';
import { logOrderActivity } from '@/lib/server/order-activity';
import {
  getOrderItemIdsAwaitingSupplierReplacement,
  pollRunHasUnresolvedSupplierReplacementThreads,
} from '@/lib/supplier-poll/supplier-poll-replacement-gate';

export type { SupplierPollItemStatus, SupplierPollSnapshot };

const COMPLETION_MESSAGE =
  'Опрос закончен. Наличие по всем позициям уточнено; по запрошенным заменам получены ответы поставщика.';

function parseOrderItemIdsJson(j: Prisma.JsonValue | null): string[] {
  if (j == null || !Array.isArray(j)) return [];
  return j.map(x => String(x));
}

type ItemForSnapshot = {
  id: string;
  isAvailable: boolean | null;
  product: {
    provider: { phone: string | null } | null;
  } | null;
};

function idleItemStatuses(
  items: ItemForSnapshot[]
): Record<string, SupplierPollItemStatus> {
  const m: Record<string, SupplierPollItemStatus> = {};
  for (const it of items) {
    m[it.id] = 'idle';
  }
  return m;
}

async function loadPolledIdsForRun(pollRunId: string): Promise<Set<string>> {
  const links = await prisma.supplierPollWaMessage.findMany({
    where: { pollRunId },
    select: { orderItemId: true, orderItemIdsJson: true },
  });
  const polled = new Set<string>();
  for (const l of links) {
    if (l.orderItemId) polled.add(l.orderItemId);
    for (const id of parseOrderItemIdsJson(l.orderItemIdsJson)) {
      polled.add(id);
    }
  }
  return polled;
}

/** Все позиции из run с непустым опросом имеют isAvailable */
function allPolledItemsHaveAvailability(
  polled: Set<string>,
  items: ItemForSnapshot[]
): boolean {
  if (polled.size === 0) return false;
  const byId = new Map(items.map(i => [i.id, i] as const));
  for (const id of polled) {
    const it = byId.get(id);
    if (!it || it.isAvailable === null) return false;
  }
  return true;
}

async function inactiveSnapshotWithCompletionNotice(
  orderId: string,
  items: ItemForSnapshot[]
): Promise<Extract<SupplierPollSnapshot, { isActive: false }>> {
  const base: Extract<SupplierPollSnapshot, { isActive: false }> = {
    isActive: false,
    itemStatuses: idleItemStatuses(items),
  };

  const last = await prisma.supplierPollRun.findFirst({
    where: { orderId, status: 'COMPLETED' },
    orderBy: { createdAt: 'desc' },
    select: { id: true, createdAt: true },
  });
  if (!last) {
    return base;
  }

  const polled = await loadPolledIdsForRun(last.id);
  if (!allPolledItemsHaveAvailability(polled, items)) {
    return base;
  }

  if (
    await pollRunHasUnresolvedSupplierReplacementThreads(
      last.id,
      orderId,
      last.createdAt
    )
  ) {
    return base;
  }

  return {
    ...base,
    completionNotice: { message: COMPLETION_MESSAGE },
  };
}

/**
 * Статусы позиций для UI: активный опрос (IN_PROGRESS), кого опрашивали, ожидание ответа vs уточнённое наличие.
 * Если по всем позициям раунда уточнено наличие — run переводится в COMPLETED и приходит completionNotice.
 */
export async function getSupplierPollSnapshot(
  orderId: string,
  items: ItemForSnapshot[]
): Promise<SupplierPollSnapshot> {
  const active = await prisma.supplierPollRun.findFirst({
    where: {
      orderId,
      status: {
        in: [SupplierPollRunStatus.IN_PROGRESS, SupplierPollRunStatus.SENDING],
      },
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, mode: true, createdAt: true, status: true },
  });

  if (!active) {
    return inactiveSnapshotWithCompletionNotice(orderId, items);
  }

  const polled = await loadPolledIdsForRun(active.id);

  if (active.status === 'SENDING') {
    const itemStatuses: Record<string, SupplierPollItemStatus> = {};
    for (const it of items) {
      const phone = it.product?.provider?.phone?.trim();
      if (!phone) {
        itemStatuses[it.id] = 'no_provider';
      } else {
        itemStatuses[it.id] = 'sending';
      }
    }
    return {
      isActive: true,
      runId: active.id,
      mode: active.mode,
      createdAt: active.createdAt.toISOString(),
      outboundSending: true,
      polledCount: 0,
      resolvedCount: 0,
      awaitingCount: 0,
      replacementAwaitingCount: 0,
      itemStatuses,
    };
  }

  const replacementAwaitingIds =
    await getOrderItemIdsAwaitingSupplierReplacement(
      active.id,
      orderId,
      active.createdAt
    );

  const itemStatuses: Record<string, SupplierPollItemStatus> = {};
  let resolvedCount = 0;
  let awaitingCount = 0;
  let replacementAwaitingCount = 0;

  for (const it of items) {
    const phone = it.product?.provider?.phone?.trim();
    if (!phone) {
      itemStatuses[it.id] = 'no_provider';
      continue;
    }
    if (!polled.has(it.id)) {
      itemStatuses[it.id] = 'not_in_active_poll';
      continue;
    }
    if (it.isAvailable !== null) {
      if (replacementAwaitingIds.has(it.id)) {
        itemStatuses[it.id] = 'awaiting_replacement';
        replacementAwaitingCount += 1;
      } else {
        itemStatuses[it.id] = 'stock_resolved';
        resolvedCount += 1;
      }
    } else {
      itemStatuses[it.id] = 'awaiting_response';
      awaitingCount += 1;
    }
  }

  const allPolledResolved = polled.size > 0 && awaitingCount === 0;

  const replacementThreadsOpen =
    allPolledResolved &&
    (await pollRunHasUnresolvedSupplierReplacementThreads(
      active.id,
      orderId,
      active.createdAt
    ));

  if (allPolledResolved && !replacementThreadsOpen) {
    await prisma.supplierPollRun.update({
      where: { id: active.id },
      data: { status: 'COMPLETED' },
    });
    try {
      await logOrderActivity({
        orderId,
        kind: 'poll_run_auto_completed',
        title:
          'Опрос поставщиков завершён: наличие и ответы по заменам уточнены по раунду',
        details: { pollRunId: active.id },
        actorType: 'SYSTEM',
      });
    } catch {
      /* best-effort */
    }

    return {
      isActive: false,
      itemStatuses: idleItemStatuses(items),
      completionNotice: { message: COMPLETION_MESSAGE },
    };
  }

  return {
    isActive: true,
    runId: active.id,
    mode: active.mode,
    createdAt: active.createdAt.toISOString(),
    polledCount: polled.size,
    resolvedCount,
    awaitingCount,
    replacementAwaitingCount,
    itemStatuses,
  };
}
