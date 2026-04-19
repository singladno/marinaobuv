import { NextRequest, NextResponse } from 'next/server';

import { tryCreateGreenApiFetcher } from '@/lib/green-api-fetcher';
import { requireAuth } from '@/lib/server/auth-helpers';
import { upsertWaAdminFromGreenApiMessage } from '@/lib/wa-admin-inbox';

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
 * Pull getChatHistory from Green API and merge into admin inbox DB (one chat, rate-limited).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, 'ADMIN');
  if (auth.error) return auth.error;

  let body: { chatId?: string; count?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Некорректное тело запроса' },
      { status: 400 }
    );
  }

  const chatId = body.chatId?.trim();
  const count = Math.min(100, Math.max(1, body.count ?? 100));

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
    const sorted = [...raw].sort((a, b) => a.timestamp - b.timestamp);
    let merged = 0;
    for (const m of sorted) {
      await upsertWaAdminFromGreenApiMessage(m, chatId);
      merged += 1;
    }
    return NextResponse.json({ ok: true, merged });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Ошибка Green API при merge';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
