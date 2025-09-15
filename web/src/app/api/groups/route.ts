import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';

export async function GET() {
  try {
    // Get all unique groups with their message counts and latest activity
    const groups = await prisma.whatsAppMessage.groupBy({
      by: ['remoteJid'],
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
            remoteJid: group.remoteJid,
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            pushName: true,
            text: true,
          },
        });

        return {
          groupId: group.remoteJid,
          messageCount: group._count.id,
          firstMessageAt: group._min.createdAt,
          lastMessageAt: group._max.createdAt,
          latestSender: latestMessage?.pushName || 'Unknown',
          latestMessagePreview:
            latestMessage?.text?.substring(0, 100) || 'No text content',
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
