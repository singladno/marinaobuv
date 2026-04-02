import { NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { logger } from '@/lib/server/logger';

export async function GET() {
  try {
    const messages = await prisma.whatsAppMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        waMessageId: true,
        chatId: true,
        fromMe: true,
        rawPayload: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    logger.error(
      { err: error, route: '/api/messages' },
      'Failed to fetch messages:'
    );
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
