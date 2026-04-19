import { NextRequest, NextResponse } from 'next/server';

import { tryCreateGreenApiFetcher } from '@/lib/green-api-fetcher';
import { requireAuth } from '@/lib/server/auth-helpers';

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

/**
 * Send via Green API. Inbox DB rows come from webhooks only
 * (outgoingAPIMessageReceived for API sends, outgoingMessageReceived for phone).
 */
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
    return NextResponse.json({ idMessage: result.idMessage });
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : 'Ошибка Green API при отправке';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
