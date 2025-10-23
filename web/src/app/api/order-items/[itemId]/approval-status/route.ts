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

    // Verify the order item belongs to this user
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

    // Check if there's an approval message for this item
    const approvalMessage = await prisma.orderItemMessage.findFirst({
      where: {
        orderItemId: itemId,
        userId: auth.user.id,
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
