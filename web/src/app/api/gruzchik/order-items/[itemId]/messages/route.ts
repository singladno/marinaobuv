import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/lib/server/session';

// Mock messages for now - will be replaced with real database implementation
const mockMessages = [
  {
    id: '1',
    text: 'Привет! Нужно проверить наличие этого товара.',
    sender: 'client',
    timestamp: new Date(Date.now() - 3600000),
    isService: false,
  },
  {
    id: '2',
    text: 'Понял, проверю у поставщика.',
    sender: 'gruzchik',
    timestamp: new Date(Date.now() - 1800000),
    isService: false,
  },
  {
    id: '3',
    text: 'Товар есть в наличии, 5 коробок.',
    sender: 'gruzchik',
    timestamp: new Date(Date.now() - 900000),
    isService: false,
  },
  {
    id: '4',
    text: 'Внутренняя заметка: поставщик просит предоплату 50%',
    sender: 'gruzchik',
    timestamp: new Date(Date.now() - 300000),
    isService: true,
  },
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'GRUZCHIK') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId } = await params;

    // TODO: Replace with real database query
    // For now, return mock messages
    const messages = mockMessages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      messages,
      itemId,
    });
  } catch (error) {
    console.error('Failed to fetch order item messages:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'GRUZCHIK') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId } = await params;
    const { text, isService, attachments } = await request.json();

    if (!text && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: 'Message text or attachments required' },
        { status: 400 }
      );
    }

    // TODO: Replace with real database implementation
    // For now, just return a success response
    const newMessage = {
      id: Date.now().toString(),
      text: text || '',
      sender: 'gruzchik',
      timestamp: new Date().toISOString(),
      isService: isService || false,
      attachments: attachments || [],
    };

    console.log('New message for item', itemId, ':', newMessage);

    return NextResponse.json({
      success: true,
      message: newMessage,
    });
  } catch (error) {
    console.error('Failed to send order item message:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
