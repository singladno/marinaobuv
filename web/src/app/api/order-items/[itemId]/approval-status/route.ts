import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSession } from '@/lib/server/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId } = await params;

    // Verify the order item belongs to this user
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: itemId,
        order: {
          userId: session.userId,
        },
      },
    });

    if (!orderItem) {
      return NextResponse.json(
        { error: 'Order item not found' },
        { status: 404 }
      );
    }

    // Check if there's an approval message for this item
    const approvalMessage = await prisma.orderItemMessage.findFirst({
      where: {
        orderItemId: itemId,
        userId: session.userId,
        text: 'Товар одобрен клиентом',
        isService: true,
      },
    });

    const isApproved = !!approvalMessage;

    return NextResponse.json({
      isApproved,
      approvedAt: approvalMessage?.createdAt || null,
    });
  } catch (error) {
    console.error('Failed to get approval status:', error);
    return NextResponse.json(
      { error: 'Failed to get approval status' },
      { status: 500 }
    );
  }
}
