import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/server/auth-helpers';
import { markWaAdminChatRead } from '@/lib/wa-admin-inbox';

function isValidChatId(id: string): boolean {
  if (!id || id.length > 200) return false;
  if (!/^[0-9+\-@.a-zA-Z_]+$/.test(id)) return false;
  return (
    id.endsWith('@c.us') ||
    id.endsWith('@g.us') ||
    id.endsWith('@s.whatsapp.net')
  );
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, 'ADMIN');
  if (auth.error) return auth.error;

  let body: { chatId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Некорректное тело запроса' },
      { status: 400 }
    );
  }

  const chatId = body.chatId?.trim();
  if (!chatId || !isValidChatId(chatId)) {
    return NextResponse.json({ error: 'Некорректный chatId' }, { status: 400 });
  }

  await markWaAdminChatRead(auth.user.id, chatId);
  return NextResponse.json({ ok: true });
}
