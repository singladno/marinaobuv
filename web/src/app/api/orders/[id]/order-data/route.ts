import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/server/db';
import { authOptions } from '@/lib/auth';

interface OrderItemData {
  itemId: string;
  hasMessages: boolean;
  totalMessages: number;
  unreadCount: number;
  isApproved: boolean;
  approvedAt: string | null;
}

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
      return NextResponse.json({
        itemsWithMessages: [],
        totalItems: 0,
        itemsWithMessagesCount: 0,
        itemsWithoutMessagesCount: 0,
        messageCounts: {},
        unreadCounts: {},
        approvalStatuses: {},
      });
    }

    // Get all data for all items in parallel
    const [itemsWithMessages, messageCounts, unreadCounts, approvalStatuses] =
      await Promise.all([
        // Get items with messages (excluding messages sent by the current user)
        prisma.orderItemMessage.findMany({
          where: {
            orderItemId: { in: itemIds },
            userId: { not: session.user.id },
          },
          select: {
            orderItemId: true,
          },
          distinct: ['orderItemId'],
        }),

        // Get message counts for all items
        Promise.all(
          itemIds.map(async itemId => {
            const totalMessages = await prisma.orderItemMessage.count({
              where: {
                orderItemId: itemId,
                userId: { not: session.user.id },
              },
            });
            return { itemId, totalMessages, hasMessages: totalMessages > 0 };
          })
        ),

        // Get unread counts for all items
        Promise.all(
          itemIds.map(async itemId => {
            const totalMessages = await prisma.orderItemMessage.count({
              where: {
                orderItemId: itemId,
                userId: { not: session.user.id },
              },
            });

            const readMessages = await prisma.orderItemMessageRead.count({
              where: {
                message: {
                  orderItemId: itemId,
                  userId: { not: session.user.id },
                },
                userId: session.user.id,
              },
            });

            const unreadCount = Math.max(0, totalMessages - readMessages);
            return { itemId, unreadCount, totalMessages };
          })
        ),

        // Get approval statuses for all items
        Promise.all(
          itemIds.map(async itemId => {
            const approvalMessage = await prisma.orderItemMessage.findFirst({
              where: {
                orderItemId: itemId,
                userId: session.user.id,
                text: 'Товар одобрен клиентом',
                isService: true,
              },
              select: {
                createdAt: true,
              },
            });

            return {
              itemId,
              isApproved: !!approvalMessage,
              approvedAt: approvalMessage?.createdAt.toISOString() || null,
            };
          })
        ),
      ]);

    // Transform the data into the expected format
    const itemsWithMessagesList = itemsWithMessages.map(
      item => item.orderItemId
    );
    const messageCountsMap = Object.fromEntries(
      messageCounts.map(item => [
        item.itemId,
        { totalMessages: item.totalMessages, hasMessages: item.hasMessages },
      ])
    );
    const unreadCountsMap = Object.fromEntries(
      unreadCounts.map(item => [
        item.itemId,
        { unreadCount: item.unreadCount, totalMessages: item.totalMessages },
      ])
    );
    const approvalStatusesMap = Object.fromEntries(
      approvalStatuses.map(item => [
        item.itemId,
        { isApproved: item.isApproved, approvedAt: item.approvedAt },
      ])
    );

    return NextResponse.json({
      itemsWithMessages: itemsWithMessagesList,
      totalItems: itemIds.length,
      itemsWithMessagesCount: itemsWithMessagesList.length,
      itemsWithoutMessagesCount: itemIds.length - itemsWithMessagesList.length,
      messageCounts: messageCountsMap,
      unreadCounts: unreadCountsMap,
      approvalStatuses: approvalStatusesMap,
    });
  } catch (error) {
    console.error('Failed to get order data:', error);
    return NextResponse.json(
      { error: 'Failed to get order data' },
      { status: 500 }
    );
  }
}
