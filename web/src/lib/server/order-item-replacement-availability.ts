import { SupplierPollRunStatus, type Prisma } from '@prisma/client';

import { prisma } from '@/lib/server/db';
import { getOrderItemIdsAwaitingSupplierReplacement } from '@/lib/supplier-poll/supplier-poll-replacement-gate';

function parseResolvedIds(j: Prisma.JsonValue | null | undefined): Set<string> {
  if (j == null || !Array.isArray(j)) return new Set();
  return new Set(j.map(x => String(x)));
}

export type OrderItemReplacementAvailabilityHint =
  | 'awaiting_supplier'
  | 'no_replacement_from_supplier';

/**
 * Подписи в колонке «Наличие» для позиций без остатка: ждём ответ по аналогам или поставщик не предложил замену.
 */
export async function getOrderItemReplacementAvailabilityHints(
  orderId: string,
  items: Array<{ id: string; isAvailable: boolean | null }>
): Promise<Partial<Record<string, OrderItemReplacementAvailabilityHint>>> {
  const unavailable = items.filter(i => i.isAvailable === false);
  if (unavailable.length === 0) return {};

  const active = await prisma.supplierPollRun.findFirst({
    where: {
      orderId,
      status: {
        in: [SupplierPollRunStatus.IN_PROGRESS, SupplierPollRunStatus.SENDING],
      },
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, createdAt: true },
  });

  let awaiting = new Set<string>();
  if (active) {
    awaiting = await getOrderItemIdsAwaitingSupplierReplacement(
      active.id,
      orderId,
      active.createdAt
    );
  }

  const pendingRows = await prisma.orderItemReplacement.findMany({
    where: {
      orderItemId: { in: unavailable.map(i => i.id) },
      status: 'PENDING',
    },
    select: { orderItemId: true },
  });
  const pending = new Set(pendingRows.map(r => r.orderItemId));

  const runs = await prisma.supplierPollRun.findMany({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
    select: {
      createdAt: true,
      replacementSupplierResolvedItemIds: true,
    },
  });

  const out: Partial<Record<string, OrderItemReplacementAvailabilityHint>> = {};

  for (const it of unavailable) {
    const id = it.id;
    if (awaiting.has(id)) {
      out[id] = 'awaiting_supplier';
      continue;
    }
    if (pending.has(id)) {
      continue;
    }

    const run = runs.find(r =>
      parseResolvedIds(r.replacementSupplierResolvedItemIds).has(id)
    );
    if (!run) continue;

    const firstAfterRun = await prisma.orderItemReplacement.findFirst({
      where: {
        orderItemId: id,
        createdAt: { gte: run.createdAt },
      },
      orderBy: { createdAt: 'asc' },
      select: { status: true },
    });

    if (!firstAfterRun) {
      out[id] = 'no_replacement_from_supplier';
    }
  }

  return out;
}
