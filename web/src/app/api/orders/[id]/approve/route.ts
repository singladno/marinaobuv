import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSession } from '@/lib/server/session';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: orderId } = await params;

    // Verify the order belongs to this user and is in "Согласование" status
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.userId,
        status: 'Согласование',
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or not in approval status' },
        { status: 404 }
      );
    }

    // Update order status to next status in the flow
    // Based on the status flow: Согласование -> Согласован
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'Согласован',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Failed to approve order:', error);
    return NextResponse.json(
      { error: 'Failed to approve order' },
      { status: 500 }
    );
  }
}
