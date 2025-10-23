import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const auth = await requireAuth(request, 'CLIENT');
    if (auth.error) {
      return auth.error;
    }

    const { itemId } = await params;

    // Verify the order item belongs to this client
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: itemId,
        order: {
          userId: auth.user.id,
        },
      },
    });

    if (!orderItem) {
      return NextResponse.json(
        { error: 'Order item not found' },
        { status: 404 }
      );
    }

    // Get total messages for this order item (excluding messages sent by the client)
    const totalMessages = await prisma.orderItemMessage.count({
      where: {
        orderItemId: itemId,
        userId: {
          not: auth.user.id, // Exclude messages sent by the client themselves
        },
      },
    });

    // Get messages read by client (excluding messages sent by the client)
    const readMessages = await prisma.orderItemMessageRead.count({
      where: {
        message: {
          orderItemId: itemId,
          userId: {
            not: auth.user.id, // Exclude messages sent by the client themselves
          },
        },
        userId: auth.user.id,
      },
    });

    const unreadCount = totalMessages - readMessages;

    return NextResponse.json({
      unreadCount: Math.max(0, unreadCount),
      totalMessages,
    });
  } catch (error) {
    console.error('Failed to get unread message count:', error);
    return NextResponse.json(
      { error: 'Failed to get unread message count' },
      { status: 500 }
    );
  }
}
