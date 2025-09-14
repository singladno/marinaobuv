import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeDrafts = searchParams.get('includeDrafts') === 'true';

    // Validate group ID format (should end with @g.us)
    if (!groupId.endsWith('@g.us')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid group ID format. Must end with @g.us',
      }, { status: 400 });
    }

    // Build select object based on includeDrafts parameter
    const selectObject: any = {
      id: true,
      waMessageId: true,
      remoteJid: true,
      fromMe: true,
      pushName: true,
      messageType: true,
      text: true,
      mediaUrl: true,
      mediaS3Key: true,
      createdAt: true,
    };

    if (includeDrafts) {
      selectObject.productDraft = {
        select: {
          name: true,
          article: true,
          season: true,
          typeSlug: true,
          pricePair: true,
          packPairs: true,
          priceBox: true,
          material: true,
          gender: true,
          sizes: true,
          notes: true,
          createdAt: true,
        },
      };
    }

    // Fetch messages for the specific group
    const messages = await prisma.whatsAppMessage.findMany({
      where: {
        remoteJid: groupId,
      },
      select: selectObject,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100), // Cap at 100 messages
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await prisma.whatsAppMessage.count({
      where: {
        remoteJid: groupId,
      },
    });

    // Get group statistics
    const stats = await prisma.whatsAppMessage.groupBy({
      by: ['messageType'],
      where: {
        remoteJid: groupId,
      },
      _count: {
        messageType: true,
      },
    });

    return NextResponse.json({
      success: true,
      groupId,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      statistics: {
        totalMessages: totalCount,
        messageTypes: stats.reduce((acc, stat) => {
          acc[stat.messageType || 'unknown'] = stat._count.messageType;
          return acc;
        }, {} as Record<string, number>),
      },
      messages,
    });
  } catch (error) {
    console.error('Failed to fetch group messages:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
