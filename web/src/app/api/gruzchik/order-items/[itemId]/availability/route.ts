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
        // Assuming you have an isAvailable field in your OrderItem model
        // If not, you might need to add it to your Prisma schema
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
