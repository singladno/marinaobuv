import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/server/db';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !('id' in session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: orderId } = await params;

    // Verify the order belongs to this user
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
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
      // Get total messages for this order item (excluding messages sent by this user)
      const totalMessages = await prisma.orderItemMessage.count({
        where: {
          orderItemId: itemId,
          userId: {
            not: session.user.id, // Exclude messages sent by this user themselves
          },
        },
      });

      // Get messages read by this user (excluding messages sent by this user)
      const readMessages = await prisma.orderItemMessageRead.count({
        where: {
          message: {
            orderItemId: itemId,
            userId: {
              not: session.user.id, // Exclude messages sent by this user themselves
            },
          },
          userId: session.user.id,
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
