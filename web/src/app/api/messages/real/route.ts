import { NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';

export async function GET() {
  try {
    // Get the last 10 messages, prioritizing real messages over test messages
    const messages = await prisma.whatsAppMessage.findMany({
      select: {
        id: true,
        waMessageId: true,
        chatId: true,
        fromMe: true,
        rawPayload: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // Categorize messages as real vs test
    const categorizedMessages = messages.map(msg => {
      const isTestMessage =
        msg.waMessageId.startsWith('test-') ||
        msg.waMessageId.startsWith('group-test-') ||
        msg.waMessageId.startsWith('user-message-');

      return {
        ...msg,
        isRealMessage: !isTestMessage,
        source: isTestMessage ? 'TEST' : 'REAL_WHATSAPP',
      };
    });

    const realMessages = categorizedMessages.filter(msg => msg.isRealMessage);
    const testMessages = categorizedMessages.filter(msg => !msg.isRealMessage);

    return NextResponse.json({
      success: true,
      summary: {
        total: messages.length,
        realMessages: realMessages.length,
        testMessages: testMessages.length,
      },
      realMessages: realMessages,
      testMessages: testMessages,
      allMessages: categorizedMessages,
    });
  } catch (error) {
    console.error('Failed to fetch real messages:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
