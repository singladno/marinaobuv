import { NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';

export async function GET() {
  try {
    // Get the most recent messages from the database
    const recentMessages = await prisma.whatsAppMessage.findMany({
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
      take: 20,
    });

    // Categorize and format the messages
    const formattedMessages = recentMessages.map(msg => {
      const isTestMessage =
        msg.waMessageId.startsWith('test-') ||
        msg.waMessageId.startsWith('group-test-') ||
        msg.waMessageId.startsWith('user-message-');

      return {
        id: msg.id,
        waMessageId: msg.waMessageId,
        groupId: (msg as any).chatId,
        sender: (msg as any).pushName,
        messageType: (msg as any).messageType,
        text: (msg as any).text,
        mediaUrl: (msg as any).mediaUrl,
        timestamp: msg.createdAt,
        isRealMessage: !isTestMessage,
        source: isTestMessage ? 'TEST' : 'REAL_WHATSAPP',
        rawData: msg.rawPayload,
      };
    });

    interface ChatGroup {
      chatId: string;
      messageCount: number;
      messages: Array<{
        groupId: string;
        timestamp: string;
        [key: string]: unknown;
      }>;
      latestMessage: {
        groupId: string;
        timestamp: string;
        [key: string]: unknown;
      } | null;
    }

    // Group by chat
    const groupedByChat = formattedMessages.reduce(
      (acc, msg) => {
        const chatId = msg.groupId;
        if (!acc[chatId]) {
          acc[chatId] = {
            chatId,
            messageCount: 0,
            messages: [],
            latestMessage: null,
          };
        }
        acc[chatId].messageCount++;
        {
          const ts = (msg.timestamp as any as Date).toISOString();
          acc[chatId].messages.push({
            ...msg,
            groupId: chatId,
            timestamp: ts,
          });
        }
        if (
          !acc[chatId].latestMessage ||
          new Date(msg.timestamp).toISOString() >
            acc[chatId].latestMessage.timestamp
        ) {
          {
            const ts = (msg.timestamp as any as Date).toISOString();
            acc[chatId].latestMessage = {
              ...msg,
              groupId: chatId,
              timestamp: ts,
            } as any;
          }
        }
        return acc;
      },
      {} as Record<string, ChatGroup>
    );

    const chatList = Object.values(groupedByChat).sort(
      (a: ChatGroup, b: ChatGroup) =>
        new Date(b.latestMessage!.timestamp).getTime() -
        new Date(a.latestMessage!.timestamp).getTime()
    );

    return NextResponse.json({
      success: true,
      message: 'Recent messages from WhatsApp chats',
      summary: {
        totalMessages: recentMessages.length,
        realMessages: formattedMessages.filter(m => m.isRealMessage).length,
        testMessages: formattedMessages.filter(m => !m.isRealMessage).length,
        totalChats: chatList.length,
      },
      chats: chatList.slice(0, 10), // Top 10 most recent chats
      allMessages: formattedMessages,
    });
  } catch (error) {
    console.error('Failed to process recent messages:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json({ ok: true });
}
