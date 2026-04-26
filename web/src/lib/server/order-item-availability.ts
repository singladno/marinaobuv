import { prisma } from '@/lib/server/db';
import { logger } from '@/lib/server/logger';

/**
 * Shared availability + product active toggle (same behavior as gruzchik PATCH).
 */
export async function setOrderItemAvailabilityAndProductActive(params: {
  itemId: string;
  isAvailable: boolean | null;
}): Promise<void> {
  const { itemId, isAvailable } = params;

  const updatedItem = await prisma.orderItem.update({
    where: { id: itemId },
    data: { isAvailable },
    select: { productId: true },
  });

  if (isAvailable === false) {
    await prisma.product.update({
      where: { id: updatedItem.productId },
      data: {
        isActive: false,
        activeUpdatedAt: new Date(),
      },
    });
    logger.debug(
      `[availability] Product ${updatedItem.productId} deactivated (item ${itemId})`
    );
  } else if (isAvailable === true) {
    await prisma.product.update({
      where: { id: updatedItem.productId },
      data: {
        isActive: true,
        activeUpdatedAt: new Date(),
      },
    });
    logger.debug(
      `[availability] Product ${updatedItem.productId} activated (item ${itemId})`
    );
  }
}
