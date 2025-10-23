import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request, 'CLIENT');
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
      return NextResponse.json({ approvalStatuses: {} });
    }

    // Get approval statuses for all items in this order
    const approvalStatuses: Record<
      string,
      { isApproved: boolean; approvedAt: string | null }
    > = {};

    for (const itemId of itemIds) {
      const approvalMessage = await prisma.orderItemMessage.findFirst({
        where: {
          orderItemId: itemId,
          userId: auth.user.id,
          text: 'Товар одобрен клиентом',
          isService: true,
        },
        select: {
          createdAt: true,
        },
      });

      approvalStatuses[itemId] = {
        isApproved: !!approvalMessage,
        approvedAt: approvalMessage?.createdAt.toISOString() || null,
      };
    }

    return NextResponse.json({ approvalStatuses });
  } catch (error) {
    console.error('Failed to get approval statuses:', error);
    return NextResponse.json(
      { error: 'Failed to get approval statuses' },
      { status: 500 }
    );
  }
}
