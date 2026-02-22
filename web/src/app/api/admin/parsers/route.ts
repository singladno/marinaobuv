import { NextResponse } from 'next/server';
import { getWaChatIds } from '@/lib/env';
import { prisma } from '@/lib/server/db';

export type ParserType = 'wa' | 'tg';

export interface ParserItem {
  id: string;
  name: string;
  description: string;
  type: ParserType;
  /** For WA: chat id for per-chat detail. Null for TG or "all WA" legacy. */
  sourceId: string | null;
  /** URL path segment for this parser (e.g. "tg", "wa", or "wa/<encodedChatId>") */
  path: string;
}

function formatWaChatLabel(chatId: string): string {
  if (chatId.endsWith('@g.us')) return `Группа ${chatId.replace('@g.us', '')}`;
  if (chatId.endsWith('@c.us')) return `Чат ${chatId.replace('@c.us', '')}`;
  return chatId.length > 25 ? `${chatId.slice(0, 22)}…` : chatId;
}

/**
 * Returns the list of parsers for the admin parsing page.
 * WA: one entry per chat from WA_CHAT_IDS (or TARGET_GROUP_ID); names from WhatsAppChat when available.
 * TG: single Telegram parser.
 */
export async function GET() {
  try {
    const waChatIds = getWaChatIds();
    const parsers: ParserItem[] = [];

    // Telegram parser (single)
    parsers.push({
      id: 'tg',
      name: '32-61/63 Telegram',
      description: 'Парсинг цветов из Telegram канала',
      type: 'tg',
      sourceId: null,
      path: 'tg',
    });

    // WhatsApp: one parser per chat; resolve names from WhatsAppChat
    if (waChatIds.length === 0) {
      parsers.push({
        id: 'wa',
        name: 'WhatsApp (чаты не настроены)',
        description: 'Настройте WA_CHAT_IDS в .env для парсинга чатов',
        type: 'wa',
        sourceId: null,
        path: 'wa',
      });
    } else {
      const waChats = await prisma.whatsAppChat.findMany({
        where: { chatId: { in: waChatIds } },
        select: { chatId: true, name: true },
      });
      const nameByChatId = Object.fromEntries(
        waChats.map(c => [
          c.chatId,
          (c.name && c.name.trim()) || formatWaChatLabel(c.chatId),
        ])
      );

      waChatIds.forEach((chatId, index) => {
        const displayName = nameByChatId[chatId] ?? formatWaChatLabel(chatId);
        parsers.push({
          id: `wa-${index}`,
          name: `WhatsApp — ${displayName}`,
          description: `Парсинг товаров из чата ${displayName}`,
          type: 'wa',
          sourceId: chatId,
          path: `wa/${encodeURIComponent(chatId)}`,
        });
      });
    }

    return NextResponse.json({ parsers });
  } catch (error) {
    console.error('Error fetching parsers list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parsers' },
      { status: 500 }
    );
  }
}
