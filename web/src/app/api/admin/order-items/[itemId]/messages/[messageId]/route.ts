import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string; messageId: string }> }
) {
  try {
    const auth = await requireAuth(request, 'ADMIN');
    if (auth.error) {
      return auth.error;
    }

    const { itemId, messageId } = await params;
    const { text } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'Message text is required' },
        { status: 400 }
      );
    }

    // Verify the order item exists
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: itemId,
      },
    });

    if (!orderItem) {
      return NextResponse.json(
        { error: 'Order item not found' },
        { status: 404 }
      );
    }

    // Verify the message exists
    const message = await prisma.orderItemMessage.findFirst({
      where: {
        id: messageId,
        orderItemId: itemId,
      },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Update the message
    const updatedMessage = await prisma.orderItemMessage.update({
      where: { id: messageId },
      data: { text: text.trim() },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    // Transform message to match frontend format
    const transformedMessage = {
      id: updatedMessage.id,
      text: updatedMessage.text,
      sender:
        updatedMessage.user.role === 'GRUZCHIK'
          ? 'gruzchik'
          : updatedMessage.user.role === 'ADMIN'
            ? 'admin'
            : 'client',
      senderName: updatedMessage.user.name || updatedMessage.user.phone,
      senderId: updatedMessage.user.id,
      timestamp: updatedMessage.createdAt.toISOString(),
      isService: updatedMessage.isService,
      attachments: updatedMessage.attachments,
    };

    return NextResponse.json({
      success: true,
      message: transformedMessage,
    });
  } catch (error) {
    console.error('Failed to update message:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string; messageId: string }> }
) {
  try {
    const auth = await requireAuth(request, 'ADMIN');
    if (auth.error) {
      return auth.error;
    }

    const { itemId, messageId } = await params;

    // Verify the order item exists
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: itemId,
      },
    });

    if (!orderItem) {
      return NextResponse.json(
        { error: 'Order item not found' },
        { status: 404 }
      );
    }

    // Verify the message exists
    const message = await prisma.orderItemMessage.findFirst({
      where: {
        id: messageId,
        orderItemId: itemId,
      },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Delete the message
    await prisma.orderItemMessage.delete({
      where: { id: messageId },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Failed to delete message:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
