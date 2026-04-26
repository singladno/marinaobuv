import { prisma } from '@/lib/server/db';

/** Same product filter as GET /api/admin/orders/[id] items. */
const itemWithValidProduct = {
  product: { is: { id: { not: { equals: '' } } } },
} as const;

/**
 * Fingerprint of everything shown on the admin order page (order, lines, messages,
 * supplier poll, replacements). Used by SSE: when it changes, the client refetches.
 */
export async function getOrderDataVersion(
  orderId: string
): Promise<string | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { updatedAt: true },
  });
  if (!order) {
    return null;
  }

  const itemWhere = { orderId, ...itemWithValidProduct };

  const [
    items,
    messageAgg,
    pollRun,
    waMsgCount,
    waMaxSequence,
    replAgg,
    fbAgg,
    transportAgg,
  ] = await Promise.all([
    prisma.orderItem.findMany({
      where: itemWhere,
      select: {
        id: true,
        isAvailable: true,
        isPurchased: true,
        qty: true,
        priceBox: true,
      },
      orderBy: { id: 'asc' },
    }),
    prisma.orderItemMessage.aggregate({
      where: { orderItem: itemWhere },
      _max: { createdAt: true, updatedAt: true },
    }),
    prisma.supplierPollRun.findFirst({
      where: { orderId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, status: true, updatedAt: true, mode: true },
    }),
    prisma.supplierPollWaMessage.count({
      where: { pollRun: { orderId } },
    }),
    prisma.supplierPollWaMessage.aggregate({
      where: { pollRun: { orderId } },
      _max: { sequence: true },
    }),
    prisma.orderItemReplacement.aggregate({
      where: { orderItem: itemWhere },
      _max: { updatedAt: true, createdAt: true },
    }),
    prisma.orderItemFeedback.aggregate({
      where: { orderItem: itemWhere },
      _max: { createdAt: true },
    }),
    prisma.orderTransportOption.aggregate({
      where: { orderId },
      _max: { updatedAt: true },
    }),
  ]);

  const itemKey = items
    .map(
      i =>
        `${i.id}:${i.isAvailable ?? 'n'}:${i.isPurchased ?? 'n'}:${i.qty}:${String(
          i.priceBox
        )}`
    )
    .join(';');

  return [
    order.updatedAt.toISOString(),
    itemKey,
    messageAgg._max.createdAt?.toISOString() ?? '0',
    messageAgg._max.updatedAt?.toISOString() ?? '0',
    pollRun
      ? `${pollRun.id}|${pollRun.status}|${pollRun.mode}|${pollRun.updatedAt.toISOString()}`
      : 'no',
    String(waMsgCount),
    String(waMaxSequence._max.sequence ?? 0),
    replAgg._max.updatedAt?.toISOString() ?? '0',
    fbAgg._max.createdAt?.toISOString() ?? '0',
    transportAgg._max.updatedAt?.toISOString() ?? '0',
  ].join('|');
}
