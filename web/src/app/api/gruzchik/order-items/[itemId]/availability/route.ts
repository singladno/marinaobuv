import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';

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

      console.log(
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

      console.log(
        `Product ${updatedItem.productId} activated due to availability set to true for order item ${itemId}`
      );
    }

    return NextResponse.json({
      success: true,
      item: updatedItem,
    });
  } catch (error) {
    console.error('Error updating item availability:', error);
    return NextResponse.json(
      { error: 'Failed to update item availability' },
      { status: 500 }
    );
  }
}
