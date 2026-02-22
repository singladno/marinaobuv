import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';

function formatWaChatLabel(chatId: string): string {
  if (chatId.endsWith('@g.us')) return `Группа ${chatId.replace('@g.us', '')}`;
  if (chatId.endsWith('@c.us')) return `Чат ${chatId.replace('@c.us', '')}`;
  return chatId.length > 25 ? `${chatId.slice(0, 22)}…` : chatId;
}

/**
 * GET /api/admin/wa-chat-name?chatId=...
 * Returns display name for a WhatsApp chat (from WhatsAppChat.name or fallback label).
 */
export async function GET(request: NextRequest) {
  const chatId = request.nextUrl.searchParams.get('chatId');
  if (!chatId) {
    return NextResponse.json({ error: 'chatId required' }, { status: 400 });
  }

  try {
    const chat = await prisma.whatsAppChat.findUnique({
      where: { chatId },
      select: { name: true },
    });
    const name =
      (chat?.name && chat.name.trim()) || formatWaChatLabel(chatId);
    return NextResponse.json({ name });
  } catch (error) {
    console.error('Error fetching WA chat name:', error);
    return NextResponse.json(
      { name: formatWaChatLabel(chatId) },
      { status: 200 }
    );
  }
}
