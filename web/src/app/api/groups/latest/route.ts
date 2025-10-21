import { NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';

export async function GET() {
  try {
    // Get the most recent messages with their group IDs
    const recentMessages = await prisma.whatsAppMessage.findMany({
      select: {
        chatId: true,
        rawPayload: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // Group by remoteJid to get unique groups
    const groups = recentMessages.reduce(
      (acc, message: any) => {
        const groupId = message.chatId;
        if (!acc[groupId]) {
          acc[groupId] = {
            groupId,
            latestMessage:
              (message.text as string | undefined)?.substring(0, 100) ||
              'No text',
            latestSender: message.pushName || 'Unknown',
            latestTime: message.createdAt,
            messageCount: 0,
          };
        }
        acc[groupId].messageCount++;
        return acc;
      },
      {} as Record<
        string,
        {
          groupId: string;
          latestMessage: string;
          latestSender: string;
          latestTime: string;
          messageCount: number;
        }
      >
    );

    const groupList = Object.values(groups).sort(
      (a: { latestTime: string }, b: { latestTime: string }) =>
        new Date(b.latestTime).getTime() - new Date(a.latestTime).getTime()
    );

    return NextResponse.json({
      success: true,
      message: 'Recent group IDs from incoming messages',
      groups: groupList,
    });
  } catch (error) {
    console.error('Failed to fetch recent groups:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
