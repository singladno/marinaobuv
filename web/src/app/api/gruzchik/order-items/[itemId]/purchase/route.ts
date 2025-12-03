import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const auth = await requireAuth(request, 'GRUZCHIK');
    if (auth.error) {
      return auth.error;
    }

    const { itemId } = await params;
    const { isPurchased } = await request.json();

    if (isPurchased !== null && typeof isPurchased !== 'boolean') {
      return NextResponse.json(
        { error: 'isPurchased must be a boolean or null' },
        { status: 400 }
      );
    }

    // Verify the order item belongs to an order assigned to this грузчик
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: {
        order: {
          select: {
            gruzchikId: true,
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

    if (orderItem.order.gruzchikId !== auth.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update the order item purchase status
    const updatedItem = await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        isPurchased,
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
    console.error('Error updating item purchase status:', error);
    return NextResponse.json(
      { error: 'Failed to update item purchase status' },
      { status: 500 }
    );
  }
}
