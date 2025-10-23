import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { authenticateRequest } from '@/lib/server/auth-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const auth = await authenticateRequest(request, 'ADMIN');
    if (auth.response) {
      return auth.response;
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
    console.error('Failed to get unread message count:', error);
    return NextResponse.json(
      { error: 'Failed to get unread message count' },
      { status: 500 }
    );
  }
}
