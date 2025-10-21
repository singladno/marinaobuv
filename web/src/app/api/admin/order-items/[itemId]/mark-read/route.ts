import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSession } from '@/lib/server/session';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId } = await params;

    // Get all messages for this order item that haven't been read by this admin
    // (excluding messages sent by the admin themselves)
    const unreadMessages = await prisma.orderItemMessage.findMany({
      where: {
        orderItemId: itemId,
        userId: {
          not: session.userId, // Exclude messages sent by the admin themselves
        },
        readBy: {
          none: {
            userId: session.userId,
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
          userId: session.userId,
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
