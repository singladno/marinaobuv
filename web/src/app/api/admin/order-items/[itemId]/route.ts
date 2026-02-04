import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const auth = await requireAuth(request, 'ADMIN');
    if (auth.error) {
      return auth.error;
    }

    const { itemId } = await params;

    // Verify the order item exists
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: itemId,
      },
      include: {
        order: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!orderItem) {
      return NextResponse.json(
        { error: 'Order item not found' },
        { status: 404 }
      );
    }

    // Delete the order item (cascade will handle related data)
    await prisma.orderItem.delete({
      where: { id: itemId },
    });

    // Recalculate order totals
    const remainingItems = await prisma.orderItem.findMany({
      where: {
        orderId: orderItem.order.id,
      },
    });

    const subtotal = remainingItems.reduce(
      (sum, item) => sum + Number(item.priceBox) * item.qty,
      0
    );

    // Update order totals
    await prisma.order.update({
      where: { id: orderItem.order.id },
      data: {
        subtotal,
        total: subtotal,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Order item deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete order item:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
