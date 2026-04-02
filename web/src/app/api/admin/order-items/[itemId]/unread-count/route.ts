import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';
import { logRequestError } from '@/lib/server/request-logging';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const auth = await requireAuth(request, 'ADMIN');
    if (auth.error) {
      return auth.error;
    }

    const { itemId } = await params;

    // Get total messages for this order item (excluding messages sent by the admin)
    const totalMessages = await prisma.orderItemMessage.count({
      where: {
        orderItemId: itemId,
        userId: {
          not: auth.user.id, // Exclude messages sent by the admin themselves
        },
      },
    });

    // Get messages read by admin (excluding messages sent by the admin)
    const readMessages = await prisma.orderItemMessageRead.count({
      where: {
        message: {
          orderItemId: itemId,
          userId: {
            not: auth.user.id, // Exclude messages sent by the admin themselves
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
    logRequestError(request, '/api/admin/order-items/[itemId]/unread-count', error, 'Failed to get unread message count:');
    return NextResponse.json(
      { error: 'Failed to get unread message count' },
      { status: 500 }
    );
  }
}
