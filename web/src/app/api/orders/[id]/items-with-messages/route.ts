import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request, ['CLIENT', 'GRUZCHIK']);
    if (auth.error) {
      return auth.error;
    }

    const { id: orderId } = await params;

    // Verify the order belongs to this user
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: auth.user.id,
      },
      include: {
        items: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const itemIds = order.items.map(item => item.id);

    if (itemIds.length === 0) {
      return NextResponse.json({ itemsWithMessages: [] });
    }

    // Check which items have messages (excluding messages sent by the current user)
    const itemsWithMessages: string[] = [];

    for (const itemId of itemIds) {
      const messageCount = await prisma.orderItemMessage.count({
        where: {
          orderItemId: itemId,
          userId: {
            not: auth.user.id, // Exclude messages sent by this user
          },
        },
      });

      if (messageCount > 0) {
        itemsWithMessages.push(itemId);
      }
    }

    return NextResponse.json({
      itemsWithMessages,
      totalItems: itemIds.length,
      itemsWithMessagesCount: itemsWithMessages.length,
      itemsWithoutMessagesCount: itemIds.length - itemsWithMessages.length,
    });
  } catch (error) {
    console.error('Failed to get items with messages:', error);
    return NextResponse.json(
      { error: 'Failed to get items with messages' },
      { status: 500 }
    );
  }
}
