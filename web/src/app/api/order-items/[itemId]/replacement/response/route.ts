import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSession } from '@/lib/server/session';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId } = await params;
    const { status, clientComment } = await request.json();

    if (!status || !['ACCEPTED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Verify the order item belongs to this client
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

    // Find pending replacement for this item
    const replacement = await prisma.orderItemReplacement.findFirst({
      where: {
        orderItemId: itemId,
        clientUserId: session.userId,
        status: 'PENDING',
      },
    });

    if (!replacement) {
      return NextResponse.json(
        { error: 'No pending replacement found' },
        { status: 404 }
      );
    }

    // Update replacement status
    const updatedReplacement = await prisma.orderItemReplacement.update({
      where: {
        id: replacement.id,
      },
      data: {
        status: status,
        clientComment: clientComment || null,
      },
      include: {
        adminUser: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        clientUser: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      replacement: {
        id: updatedReplacement.id,
        status: updatedReplacement.status,
        replacementImageUrl: updatedReplacement.replacementImageUrl,
        replacementImageKey: updatedReplacement.replacementImageKey,
        adminComment: updatedReplacement.adminComment,
        clientComment: updatedReplacement.clientComment,
        createdAt: updatedReplacement.createdAt.toISOString(),
        adminUser: updatedReplacement.adminUser,
        clientUser: updatedReplacement.clientUser,
      },
    });
  } catch (error) {
    console.error('Failed to update replacement:', error);
    return NextResponse.json(
      { error: 'Failed to update replacement' },
      { status: 500 }
    );
  }
}
