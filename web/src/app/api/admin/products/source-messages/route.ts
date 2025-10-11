import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db-node';

export async function POST(request: NextRequest) {
  try {
    const { messageIds } = await request.json();

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json(
        { error: 'Message IDs are required' },
        { status: 400 }
      );
    }

    // Fetch messages from database
    const messages = await prisma.whatsAppMessage.findMany({
      where: {
        id: { in: messageIds },
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        waMessageId: true,
        from: true,
        fromName: true,
        type: true,
        text: true,
        mediaUrl: true,
        mediaMimeType: true,
        mediaFileSize: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      messages,
      count: messages.length,
    });
  } catch (error) {
    console.error('Error fetching source messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
