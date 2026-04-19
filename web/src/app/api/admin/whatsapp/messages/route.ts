import { NextRequest, NextResponse } from 'next/server';

import { tryCreateGreenApiAdminFetcher } from '@/lib/green-api-fetcher';
import { persistWaAdminOutgoingTextFromSendApi } from '@/lib/wa-admin-inbox';
import { requireAuth } from '@/lib/server/auth-helpers';
import { logServerError } from '@/lib/server/logger';
import { isValidAdminWaChatId } from '@/lib/server/wa-chat-id';

const MAX_MESSAGE_LEN = 20000;

/**
 * Send via Green API. Rows are written immediately via
 * {@link persistWaAdminOutgoingTextFromSendApi}; webhooks still enrich the same id.
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

  if (!chatId || !isValidAdminWaChatId(chatId)) {
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

  const api = tryCreateGreenApiAdminFetcher();
  if (!api) {
    return NextResponse.json(
      { error: 'Green API не настроен на сервере' },
      { status: 503 }
    );
  }

  try {
    const result = await api.sendTextMessage(chatId, message);
    try {
      await persistWaAdminOutgoingTextFromSendApi({
        chatId,
        waMessageId: result.idMessage,
        text: message,
      });
    } catch (persistErr) {
      logServerError(
        '[admin/whatsapp/messages] persist outgoing text failed:',
        persistErr
      );
    }
    return NextResponse.json({ idMessage: result.idMessage });
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : 'Ошибка Green API при отправке';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
