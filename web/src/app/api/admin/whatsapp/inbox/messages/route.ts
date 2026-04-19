import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db-node';
import { requireAuth } from '@/lib/server/auth-helpers';
import { inferIsFromMeFromWaWebhookPayload } from '@/lib/wa-admin-inbox';

function isValidChatId(id: string): boolean {
  if (!id || id.length > 200) return false;
  if (!/^[0-9+\-@.a-zA-Z_]+$/.test(id)) return false;
  return (
    id.endsWith('@c.us') ||
    id.endsWith('@g.us') ||
    id.endsWith('@s.whatsapp.net')
  );
}

/** Message thread from DB only (populated by Green API webhooks). */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, 'ADMIN');
  if (auth.error) return auth.error;

  const chatId = request.nextUrl.searchParams.get('chatId');
  const limit = Math.min(
    500,
    Math.max(
      1,
      parseInt(request.nextUrl.searchParams.get('limit') || '200', 10) || 200
    )
  );

  if (!chatId || !isValidChatId(chatId)) {
    return NextResponse.json({ error: 'Некорректный chatId' }, { status: 400 });
  }

  const [rowsDesc, readState] = await Promise.all([
    prisma.waAdminMessage.findMany({
      where: { chatId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    }),
    prisma.waAdminChatReadState.findUnique({
      where: {
        userId_chatId: { userId: auth.user.id, chatId },
      },
    }),
  ]);

  const readThroughTs = Number(readState?.lastReadMessageTs ?? BigInt(0));

  /** Newest-first query → reverse to chronological (oldest at top, latest at bottom). */
  const rows = [...rowsDesc].reverse();

  const messages = rows.map(m => ({
    idMessage: m.waMessageId,
    timestamp: Number(m.timestamp),
    typeMessage: m.typeMessage || 'textMessage',
    textMessage: m.textMessage ?? undefined,
    senderName: m.senderName ?? undefined,
    senderId: m.senderId ?? undefined,
    isFromMe: inferIsFromMeFromWaWebhookPayload(m.rawPayload, m.isFromMe),
    caption: m.caption ?? undefined,
    statusMessage: m.statusMessage ?? undefined,
    mediaS3Url: m.mediaS3Url ?? undefined,
    /** Полный вебхук-пейлоад для расширенного рендера (цитаты, реакции). */
    rawPayload: m.rawPayload ?? undefined,
  }));

  return NextResponse.json({
    messages,
    readThroughTs,
    source: 'db' as const,
  });
}
