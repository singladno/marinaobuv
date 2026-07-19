import { NextResponse } from 'next/server';
import { getWaChatIds } from '@/lib/env';
import { prisma } from '@/lib/server/db';
import { logger } from '@/lib/server/logger';
import { getTelegramChannels } from '@/lib/telegram-channels';

export type ParserType = 'wa' | 'tg';

export interface ParserItem {
  id: string;
  name: string;
  description: string;
  type: ParserType;
  /** For WA: chat id. For TG: channel id. */
  sourceId: string | null;
  /** URL path segment for this parser (e.g. "tg", "wa/<encodedChatId>") */
  path: string;
}

function formatWaChatLabel(chatId: string): string {
  if (chatId.endsWith('@g.us')) return `Группа ${chatId.replace('@g.us', '')}`;
  if (chatId.endsWith('@c.us')) return `Чат ${chatId.replace('@c.us', '')}`;
  return chatId.length > 25 ? `${chatId.slice(0, 22)}…` : chatId;
}

/**
 * Returns the list of parsers for the admin parsing page.
 * WA: one entry per chat from WA_CHAT_IDS.
 * TG: one entry per channel from TELEGRAM_CHANNELS (or TELEGRAM_CHANNEL_ID).
 */
export async function GET() {
  try {
    const waChatIds = getWaChatIds();
    const tgChannels = getTelegramChannels();
    const parsers: ParserItem[] = [];

    if (tgChannels.length === 0) {
      parsers.push({
        id: 'tg',
        name: 'Telegram (каналы не настроены)',
        description:
          'Настройте TELEGRAM_CHANNELS или TELEGRAM_CHANNEL_ID в .env',
        type: 'tg',
        sourceId: null,
        path: 'tg',
      });
    } else {
      tgChannels.forEach((channel, index) => {
        const profileLabel =
          channel.profile === 'cosmetics' ? 'косметика' : 'цветы';
        parsers.push({
          id: `tg-${index}`,
          name: channel.name,
          description: `Парсинг ${profileLabel} из ${channel.id}`,
          type: 'tg',
          sourceId: channel.id,
          path: `tg/${encodeURIComponent(channel.id)}`,
        });
      });
    }

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
    logger.error({ err: error }, 'Failed to list parsers');
    return NextResponse.json(
      { error: 'Failed to list parsers', parsers: [] },
      { status: 500 }
    );
  }
}
