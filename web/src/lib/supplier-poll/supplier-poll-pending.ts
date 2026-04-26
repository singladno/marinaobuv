import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/server/db';

function parseOrderItemIdsJson(j: Prisma.JsonValue | null): string[] {
  if (j == null) return [];
  if (!Array.isArray(j)) return [];
  return j.map(x => String(x));
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

/**
 * true if the run has polled items and at least one of them still has isAvailable === null
 * (same idea as allPolledItemsHaveAvailability in supplier-poll-snapshot, inverted).
 */
export async function pollRunHasPolledItemWithoutAvailability(
  pollRunId: string,
  orderId: string
): Promise<boolean> {
  const polled = await loadPolledIdsForRun(pollRunId);
  if (polled.size === 0) return false;
  const items = await prisma.orderItem.findMany({
    where: { id: { in: [...polled] }, orderId },
    select: { id: true, isAvailable: true },
  });
  const byId = new Map(items.map(i => [i.id, i] as const));
  for (const id of polled) {
    const it = byId.get(id);
    if (!it || it.isAvailable === null) return true;
  }
  return false;
}
