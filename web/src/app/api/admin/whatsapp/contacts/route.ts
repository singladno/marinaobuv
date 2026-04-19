import { NextRequest, NextResponse } from 'next/server';

import { tryCreateGreenApiAdminFetcher } from '@/lib/green-api-fetcher';
import { prisma } from '@/lib/db-node';
import { requireAuth } from '@/lib/server/auth-helpers';
import { isValidAdminWaChatId } from '@/lib/server/wa-chat-id';

/**
 * Add a personal chat to the admin inbox: verify the number on WhatsApp (Green API
 * CheckWhatsapp), then save display name in WaAdminChat. Does not modify the phone’s
 * local address book — same practical effect as “new chat” for this UI.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, 'ADMIN');
  if (auth.error) return auth.error;

  const api = tryCreateGreenApiAdminFetcher();
  if (!api) {
    return NextResponse.json(
      { error: 'Green API не настроен на сервере' },
      { status: 503 }
    );
  }

  let body: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Некорректное тело запроса' },
      { status: 400 }
    );
  }

  const firstName = (body.firstName ?? '').trim();
  const lastName = (body.lastName ?? '').trim();
  const phoneRaw = (body.phone ?? '').trim();

  if (!firstName) {
    return NextResponse.json({ error: 'Укажите имя' }, { status: 400 });
  }
  if (!phoneRaw) {
    return NextResponse.json(
      { error: 'Укажите номер телефона' },
      { status: 400 }
    );
  }

  const digits = phoneRaw.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 16) {
    return NextResponse.json(
      { error: 'Номер: от 10 до 16 цифр (международный формат)' },
      { status: 400 }
    );
  }

  try {
    const checked = await api.checkWhatsapp(digits);
    if (!checked.existsWhatsapp) {
      return NextResponse.json(
        { error: 'Этот номер не зарегистрирован в WhatsApp' },
        { status: 400 }
      );
    }

    const resolvedChatId =
      checked.chatId && isValidAdminWaChatId(checked.chatId)
        ? checked.chatId
        : `${digits}@c.us`;

    const contactName = [firstName, lastName].filter(Boolean).join(' ');

    await prisma.waAdminChat.upsert({
      where: { chatId: resolvedChatId },
      create: {
        chatId: resolvedChatId,
        name: '',
        contactName,
        chatType: 'user',
        lastActivityAt: new Date(),
      },
      update: {
        contactName,
        chatType: 'user',
      },
    });

    return NextResponse.json({
      ok: true,
      chatId: resolvedChatId,
    });
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : 'Ошибка Green API при проверке номера';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
