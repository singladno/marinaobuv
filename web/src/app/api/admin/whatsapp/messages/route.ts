import { NextRequest, NextResponse } from 'next/server';

import { tryCreateGreenApiFetcher } from '@/lib/green-api-fetcher';
import { requireAuth } from '@/lib/server/auth-helpers';
import { upsertWaAdminMessage } from '@/lib/wa-admin-inbox';

const MAX_MESSAGE_LEN = 20000;

function isValidChatId(id: string): boolean {
  if (!id || id.length > 200) return false;
  if (!/^[0-9+\-@.a-zA-Z_]+$/.test(id)) return false;
  return (
    id.endsWith('@c.us') ||
    id.endsWith('@g.us') ||
    id.endsWith('@s.whatsapp.net')
  );
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, 'ADMIN');
  if (auth.error) return auth.error;

  const chatId = request.nextUrl.searchParams.get('chatId');
  const countRaw = request.nextUrl.searchParams.get('count');
  const count = Math.min(
    100,
    Math.max(1, countRaw ? parseInt(countRaw, 10) || 50 : 50)
  );

  if (!chatId || !isValidChatId(chatId)) {
    return NextResponse.json({ error: 'Некорректный chatId' }, { status: 400 });
  }

  const api = tryCreateGreenApiFetcher();
  if (!api) {
    return NextResponse.json(
      { error: 'Green API не настроен на сервере' },
      { status: 503 }
    );
  }

  try {
    const raw = await api.getChatHistory({ chatId, count });
    const messages = [...raw].sort((a, b) => a.timestamp - b.timestamp);
    return NextResponse.json({
      messages: messages.map(m => ({
        idMessage: m.idMessage,
        timestamp: m.timestamp,
        typeMessage: m.typeMessage,
        textMessage: m.textMessage,
        senderName: m.senderName,
        senderId: m.senderId,
        isFromMe:
          typeof m.isFromMe === 'boolean' ? m.isFromMe : m.type === 'outgoing',
        caption: m.caption,
        statusMessage: m.statusMessage,
      })),
    });
  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : 'Ошибка Green API при загрузке сообщений';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, 'ADMIN');
  if (auth.error) return auth.error;

  let body: { chatId?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Некорректное тело запроса' },
      { status: 400 }
    );
  }

  const chatId = body.chatId?.trim();
  const message = body.message?.trim();

  if (!chatId || !isValidChatId(chatId)) {
    return NextResponse.json({ error: 'Некорректный chatId' }, { status: 400 });
  }
  if (!message || message.length > MAX_MESSAGE_LEN) {
    return NextResponse.json(
      {
        error: `Текст сообщения обязателен (макс. ${MAX_MESSAGE_LEN} символов)`,
      },
      { status: 400 }
    );
  }

  const api = tryCreateGreenApiFetcher();
  if (!api) {
    return NextResponse.json(
      { error: 'Green API не настроен на сервере' },
      { status: 503 }
    );
  }

  try {
    const result = await api.sendTextMessage(chatId, message);
    const ts = BigInt(Math.floor(Date.now() / 1000));
    try {
      await upsertWaAdminMessage({
        waMessageId: result.idMessage,
        chatId,
        timestamp: ts,
        typeMessage: 'textMessage',
        textMessage: message,
        isFromMe: true,
        statusMessage: 'sent',
        chatMeta: { chatType: chatId.endsWith('@g.us') ? 'group' : 'user' },
      });
    } catch {
      /* inbox optional */
    }
    return NextResponse.json({ idMessage: result.idMessage });
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : 'Ошибка Green API при отправке';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
