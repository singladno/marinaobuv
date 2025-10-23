import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const auth = await requireAuth(request, 'ADMIN');
    if (auth.error) {
      return auth.error;
    }

    const { itemId } = await params;

    // Get all messages for this order item that haven't been read by this admin
    // (excluding messages sent by the admin themselves)
    const unreadMessages = await prisma.orderItemMessage.findMany({
      where: {
        orderItemId: itemId,
        userId: {
          not: auth.user.id, // Exclude messages sent by the admin themselves
        },
        readBy: {
          none: {
            userId: auth.user.id,
          },
        },
      },
      select: {
        id: true,
      },
    });

    // Mark all unread messages as read by this admin
    if (unreadMessages.length > 0) {
      await prisma.orderItemMessageRead.createMany({
        data: unreadMessages.map((message: { id: string }) => ({
          messageId: message.id,
          userId: auth.user.id,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      success: true,
      markedAsRead: unreadMessages.length,
    });
  } catch (error) {
    console.error('Failed to mark messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
