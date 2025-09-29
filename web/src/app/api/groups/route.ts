import { NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';

export async function GET() {
  try {
    // Get all unique groups with their message counts and latest activity
    const groups = await prisma.whatsAppMessage.groupBy({
      by: ['chatId'],
      _count: {
        id: true,
      },
      _max: {
        createdAt: true,
      },
      _min: {
        createdAt: true,
      },
      orderBy: {
        _max: {
          createdAt: 'desc',
        },
      },
    });

    // Get unique group names (pushName) for each group
    const groupDetails = await Promise.all(
      groups.map(async group => {
        // Get the most recent message to extract group name
        const latestMessage = await prisma.whatsAppMessage.findFirst({
          where: {
            chatId: (group as any).chatId,
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            rawPayload: true,
          },
        });

        return {
          groupId: (group as any).chatId,
          messageCount: group._count.id,
          firstMessageAt: group._min.createdAt,
          lastMessageAt: group._max.createdAt,
          latestSender: (latestMessage as any)?.pushName || 'Unknown',
          latestMessagePreview:
            ((latestMessage as any)?.text as string | undefined)?.substring(
              0,
              100
            ) || 'No text content',
        };
      })
    );

    return NextResponse.json({
      success: true,
      totalGroups: groups.length,
      groups: groupDetails,
    });
  } catch (error) {
    console.error('Failed to fetch groups:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
