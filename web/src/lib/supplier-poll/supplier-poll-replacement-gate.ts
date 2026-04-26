import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/server/db';

function parseOrderItemIdsJson(j: Prisma.JsonValue | null): string[] {
  if (j == null || !Array.isArray(j)) return [];
  return j.map(x => String(x));
}

function parseResolvedIds(j: Prisma.JsonValue | null | undefined): Set<string> {
  if (j == null || !Array.isArray(j)) return new Set();
  return new Set(j.map(x => String(x)));
}

async function loadOrderItemIdsAskedReplacement(
  pollRunId: string
): Promise<Set<string>> {
  const rows = await prisma.supplierPollWaMessage.findMany({
    where: { pollRunId, kind: 'OUT_FOLLOWUP_REPLACEMENT' },
    select: { orderItemId: true, orderItemIdsJson: true },
  });
  const s = new Set<string>();
  for (const r of rows) {
    if (r.orderItemId) s.add(r.orderItemId);
    for (const id of parseOrderItemIdsJson(r.orderItemIdsJson)) {
      s.add(id);
    }
  }
  return s;
}

/**
 * ИИ/исполнитель зафиксировал ответ поставщика по замене (фото-аналог, отказ «нет аналога», текст).
 */
export async function mergeSupplierReplacementResolvedForPollRun(
  pollRunId: string,
  orderItemId: string
): Promise<void> {
  const run = await prisma.supplierPollRun.findUnique({
    where: { id: pollRunId },
    select: { replacementSupplierResolvedItemIds: true },
  });
  const raw = run?.replacementSupplierResolvedItemIds;
  const arr = Array.isArray(raw) ? raw.map(x => String(x)) : [];
  if (arr.includes(orderItemId)) return;
  arr.push(orderItemId);
  await prisma.supplierPollRun.update({
    where: { id: pollRunId },
    data: { replacementSupplierResolvedItemIds: arr },
  });
}

/**
 * Позиции: после ASK_REPLACEMENT, unavailable, но ответ по замене в этом прогоне ещё не закрыт.
 */
export async function getOrderItemIdsAwaitingSupplierReplacement(
  pollRunId: string,
  orderId: string,
  pollCreatedAt: Date
): Promise<Set<string>> {
  const asked = await loadOrderItemIdsAskedReplacement(pollRunId);
  if (asked.size === 0) return new Set();

  const run = await prisma.supplierPollRun.findUnique({
    where: { id: pollRunId },
    select: { replacementSupplierResolvedItemIds: true },
  });
  const resolved = parseResolvedIds(run?.replacementSupplierResolvedItemIds);

  const items = await prisma.orderItem.findMany({
    where: { orderId, id: { in: [...asked] } },
    select: { id: true, isAvailable: true },
  });
  const byId = new Map(items.map(i => [i.id, i] as const));

  const candidates: string[] = [];
  for (const oid of asked) {
    const it = byId.get(oid);
    if (!it || it.isAvailable !== false) continue;
    if (resolved.has(oid)) continue;
    candidates.push(oid);
  }
  if (candidates.length === 0) return new Set();

  const proposals = await prisma.orderItemReplacement.findMany({
    where: {
      orderItemId: { in: candidates },
      createdAt: { gte: pollCreatedAt },
    },
    select: { orderItemId: true },
  });
  const withProposal = new Set(proposals.map(p => p.orderItemId));

  const out = new Set<string>();
  for (const oid of candidates) {
    if (!withProposal.has(oid)) out.add(oid);
  }
  return out;
}

/**
 * true — по какой-то позиции уже ушёл ASK_REPLACEMENT, позиция unavailable, но ответ по замене от поставщика ещё не закрыт в этом прогоне.
 */
export async function pollRunHasUnresolvedSupplierReplacementThreads(
  pollRunId: string,
  orderId: string,
  pollCreatedAt: Date
): Promise<boolean> {
  const s = await getOrderItemIdsAwaitingSupplierReplacement(
    pollRunId,
    orderId,
    pollCreatedAt
  );
  return s.size > 0;
}
