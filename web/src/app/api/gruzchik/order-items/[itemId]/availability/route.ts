import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { logRequestError } from '@/lib/server/request-logging';
import { logger } from '@/lib/server/logger';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const { isAvailable } = await request.json();

    if (isAvailable !== null && typeof isAvailable !== 'boolean') {
      return NextResponse.json(
        { error: 'isAvailable must be a boolean or null' },
        { status: 400 }
      );
    }

    // Update the order item availability
    const updatedItem = await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        isAvailable,
      },
      include: {
        order: true,
        product: {
          include: {
            images: true,
          },
        },
      },
    });

    // Handle product activation/deactivation based on availability
    if (isAvailable === false) {
      // Deactivate the product when availability is set to false
      await prisma.product.update({
        where: { id: updatedItem.productId },
        data: {
          isActive: false,
          activeUpdatedAt: new Date(),
        },
      });

      logger.debug(
        `Product ${updatedItem.productId} deactivated due to availability set to false for order item ${itemId}`
      );
    } else if (isAvailable === true) {
      // Activate the product when availability is set to true
      await prisma.product.update({
        where: { id: updatedItem.productId },
        data: {
          isActive: true,
          activeUpdatedAt: new Date(),
        },
      });

      logger.debug(
        `Product ${updatedItem.productId} activated due to availability set to true for order item ${itemId}`
      );
    }

    return NextResponse.json({
      success: true,
      item: updatedItem,
    });
  } catch (error) {
    logRequestError(request, '/api/gruzchik/order-items/[itemId]/availability', error, 'Error updating item availability:');
    return NextResponse.json(
      { error: 'Failed to update item availability' },
      { status: 500 }
    );
  }
}
