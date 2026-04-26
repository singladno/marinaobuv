import { prisma } from '@/lib/server/db';

/** Same totals recalculation as admin DELETE /api/admin/order-items/[itemId]. */
export async function deleteOrderItemAndRecalcTotals(itemId: string): Promise<{
  orderId: string;
}> {
  const orderItem = await prisma.orderItem.findFirst({
    where: { id: itemId },
    include: {
      order: { select: { id: true } },
    },
  });

  if (!orderItem) {
    throw new Error('ORDER_ITEM_NOT_FOUND');
  }

  const orderId = orderItem.order.id;

  await prisma.orderItem.delete({
    where: { id: itemId },
  });

  const remainingItems = await prisma.orderItem.findMany({
    where: { orderId },
  });

  const subtotal = remainingItems.reduce(
    (sum, item) => sum + Number(item.priceBox) * item.qty,
    0
  );

  await prisma.order.update({
    where: { id: orderId },
    data: {
      subtotal,
      total: subtotal,
    },
  });

  return { orderId };
}
