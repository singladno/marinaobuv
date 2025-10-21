import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSession } from '@/lib/server/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: orderId } = await params;

    // Get all order items for this order
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
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
      return NextResponse.json({ unreadCounts: {} });
    }

    // Get unread counts for all items in this order
    const unreadCounts: Record<
      string,
      { unreadCount: number; totalMessages: number }
    > = {};

    for (const itemId of itemIds) {
      // Get total messages for this order item (excluding messages sent by this admin)
      const totalMessages = await prisma.orderItemMessage.count({
        where: {
          orderItemId: itemId,
          userId: {
            not: session.userId, // Exclude messages sent by this admin themselves
          },
        },
      });

      // Get messages read by this admin (excluding messages sent by this admin)
      const readMessages = await prisma.orderItemMessageRead.count({
        where: {
          message: {
            orderItemId: itemId,
            userId: {
              not: session.userId, // Exclude messages sent by this admin themselves
            },
          },
          userId: session.userId,
        },
      });

      const unreadCount = totalMessages - readMessages;

      unreadCounts[itemId] = {
        unreadCount: Math.max(0, unreadCount),
        totalMessages,
      };
    }

    return NextResponse.json({ unreadCounts });
  } catch (error) {
    console.error('Failed to get unread counts for order:', error);
    return NextResponse.json(
      { error: 'Failed to get unread counts' },
      { status: 500 }
    );
  }
}
