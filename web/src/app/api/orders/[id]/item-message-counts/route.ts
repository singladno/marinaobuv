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
      return NextResponse.json({ messageCounts: {} });
    }

    // Get message counts for all items
    const messageCounts: Record<
      string,
      { totalMessages: number; hasMessages: boolean }
    > = {};

    for (const itemId of itemIds) {
      const totalMessages = await prisma.orderItemMessage.count({
        where: {
          orderItemId: itemId,
          userId: {
            not: auth.user.id, // Exclude messages sent by this user
          },
        },
      });

      messageCounts[itemId] = {
        totalMessages,
        hasMessages: totalMessages > 0,
      };
    }

    return NextResponse.json({ messageCounts });
  } catch (error) {
    console.error('Failed to get item message counts:', error);
    return NextResponse.json(
      { error: 'Failed to get item message counts' },
      { status: 500 }
    );
  }
}
