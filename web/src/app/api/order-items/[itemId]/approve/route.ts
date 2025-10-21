import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSession } from '@/lib/server/session';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId } = await params;

    // Verify the order item belongs to this user and order is in approval status
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: itemId,
        order: {
          userId: session.userId,
          status: 'Согласование',
        },
      },
      include: {
        order: true,
      },
    });

    if (!orderItem) {
      return NextResponse.json(
        { error: 'Order item not found or not in approval status' },
        { status: 404 }
      );
    }

    // Mark the item as approved by adding a service message
    await prisma.orderItemMessage.create({
      data: {
        orderItemId: itemId,
        userId: session.userId,
        text: 'Товар одобрен клиентом',
        isService: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Item approved successfully',
    });
  } catch (error) {
    console.error('Failed to approve item:', error);
    return NextResponse.json(
      { error: 'Failed to approve item' },
      { status: 500 }
    );
  }
}
