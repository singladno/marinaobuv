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

    // Verify the order item belongs to this client
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

    // Get messages for this order item
    const messages = await prisma.orderItemMessage.findMany({
      where: {
        orderItemId: itemId,
      },
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
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Transform messages to match frontend format
    const transformedMessages = messages.map((message: any) => ({
      id: message.id,
      text: message.text,
      sender:
        message.user.role === 'GRUZCHIK'
          ? 'gruzchik'
          : message.user.role === 'CLIENT'
            ? 'admin'
            : 'client',
      senderName: message.user.name || message.user.phone,
      senderId: message.user.id,
      timestamp: message.createdAt.toISOString(),
      isService: message.isService,
      attachments: message.attachments,
    }));

    return NextResponse.json({
      success: true,
      messages: transformedMessages,
    });
  } catch (error) {
    console.error('Failed to fetch order item messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const auth = await requireAuth(request, 'CLIENT');
    if (auth.error) {
      return auth.error;
    }

    const { itemId } = await params;
    const { text, isService, attachments } = await request.json();

    if (!text && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: 'Message text or attachments required' },
        { status: 400 }
      );
    }

    // Verify the order item belongs to this client
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

    // Create message in database
    const newMessage = await prisma.orderItemMessage.create({
      data: {
        orderItemId: itemId,
        userId: auth.user.id,
        text: text || null,
        isService: isService || false,
        attachments: attachments || null,
      },
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
      id: newMessage.id,
      text: newMessage.text,
      sender: newMessage.user.role === 'CLIENT' ? 'client' : 'other',
      senderName: newMessage.user.name || newMessage.user.phone,
      senderId: newMessage.user.id,
      timestamp: newMessage.createdAt.toISOString(),
      isService: newMessage.isService,
      attachments: newMessage.attachments,
    };

    return NextResponse.json({
      success: true,
      message: transformedMessage,
    });
  } catch (error) {
    console.error('Failed to send order item message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
