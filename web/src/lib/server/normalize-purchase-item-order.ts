import { prisma } from '@/lib/server/db';

/**
 * Reassigns sortIndex to 1..N for all items in a purchase (stable order: sortIndex asc, then id).
 * Call after any write that could leave gaps, duplicates, or zeros in sortIndex.
 */
export async function normalizePurchaseItemSortIndexes(
  purchaseId: string
): Promise<void> {
  const rows = await prisma.purchaseItem.findMany({
    where: { purchaseId },
    select: { id: true, sortIndex: true },
    orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }],
  });

  await prisma.$transaction(
    rows.map((row, index) =>
      prisma.purchaseItem.update({
        where: { id: row.id },
        data: { sortIndex: index + 1 },
      })
    )
  );
}
