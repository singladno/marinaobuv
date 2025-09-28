import { NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';

export async function GET() {
  try {
    // Get recent webhook payloads to see the raw data structure
    const recentMessages = await prisma.whatsAppMessage.findMany({
      select: {
        waMessageId: true,
        remoteJid: true,
        pushName: true,
        messageType: true,
        text: true,
        rawPayload: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      message: 'Recent webhook data showing group IDs',
      count: recentMessages.length,
      messages: recentMessages.map(msg => ({
        waMessageId: msg.waMessageId,
        groupId: msg.remoteJid,
        sender: msg.pushName,
        messageType: msg.messageType,
        text: msg.text?.substring(0, 100),
        timestamp: msg.createdAt,
        rawPayload: msg.rawPayload,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch webhook data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
