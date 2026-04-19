import type { GreenApiMessage } from '@/types/green-api';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db-node';
import { logger } from '@/lib/server/logger';

/** Входящие «картинки» для бейджа: фото, стикеры, видео. */
const INCOMING_MEDIA_TYPES = [
  'imageMessage',
  'stickerMessage',
  'videoMessage',
] as const;

export type WaAdminUpsertInput = {
  waMessageId: string;
  chatId: string;
  timestamp: bigint;
  typeMessage?: string | null;
  textMessage?: string | null;
  caption?: string | null;
  senderName?: string | null;
  senderId?: string | null;
  isFromMe: boolean;
  statusMessage?: string | null;
  chatMeta?: {
    name?: string | null;
    contactName?: string | null;
    chatType?: 'user' | 'group';
  };
  rawPayload?: unknown;
};

function previewFromMessage(input: WaAdminUpsertInput): string {
  const t =
    (input.textMessage && input.textMessage.trim()) ||
    (input.caption && input.caption.trim()) ||
    '';
  if (t) return t.length > 120 ? `${t.slice(0, 117)}…` : t;
  if (input.typeMessage && input.typeMessage !== 'textMessage') {
    return `(${input.typeMessage})`;
  }
  return '—';
}

/**
 * Idempotent upsert from webhook or Green API merge. Updates chat index last activity.
 */
export async function upsertWaAdminMessage(
  input: WaAdminUpsertInput
): Promise<void> {
  const lastActivityAt = new Date(Number(input.timestamp) * 1000);
  const preview = previewFromMessage(input);
  const meta = input.chatMeta;
  const chatType = meta?.chatType ?? 'user';

  await prisma.$transaction(async tx => {
    await tx.waAdminChat.upsert({
      where: { chatId: input.chatId },
      create: {
        chatId: input.chatId,
        name: (meta?.name && String(meta.name).trim()) || '',
        contactName: meta?.contactName ? String(meta.contactName).trim() : null,
        chatType,
        lastActivityAt,
        lastPreview: preview,
        lastWaMessageId: input.waMessageId,
      },
      update: {
        lastActivityAt,
        lastPreview: preview,
        lastWaMessageId: input.waMessageId,
        ...(meta?.name != null && String(meta.name).trim()
          ? { name: String(meta.name).trim() }
          : {}),
        ...(meta?.contactName != null
          ? { contactName: String(meta.contactName).trim() || null }
          : {}),
      },
    });

    await tx.waAdminMessage.upsert({
      where: { waMessageId: input.waMessageId },
      create: {
        waMessageId: input.waMessageId,
        chatId: input.chatId,
        timestamp: input.timestamp,
        typeMessage: input.typeMessage ?? null,
        textMessage: input.textMessage ?? null,
        caption: input.caption ?? null,
        senderName: input.senderName ?? null,
        senderId: input.senderId ?? null,
        isFromMe: input.isFromMe,
        statusMessage: input.statusMessage ?? null,
        rawPayload:
          input.rawPayload === undefined
            ? undefined
            : (input.rawPayload as object),
      },
      update: {
        timestamp: input.timestamp,
        typeMessage: input.typeMessage ?? null,
        textMessage: input.textMessage ?? null,
        caption: input.caption ?? null,
        senderName: input.senderName ?? null,
        senderId: input.senderId ?? null,
        isFromMe: input.isFromMe,
        statusMessage: input.statusMessage ?? null,
        ...(input.rawPayload !== undefined
          ? { rawPayload: input.rawPayload as object }
          : {}),
      },
    });
  });
}

export async function upsertWaAdminFromGreenApiMessage(
  m: GreenApiMessage,
  fallbackChatId?: string
): Promise<void> {
  const chatId = m.chatId || fallbackChatId;
  if (!chatId || !m.idMessage) return;

  const ts = BigInt(m.timestamp);
  const isFromMe =
    typeof m.isFromMe === 'boolean' ? m.isFromMe : m.type === 'outgoing';

  const text =
    m.textMessage ||
    m.caption ||
    (m.typeMessage && m.typeMessage !== 'textMessage'
      ? `(${m.typeMessage})`
      : '') ||
    '';

  await upsertWaAdminMessage({
    waMessageId: m.idMessage,
    chatId,
    timestamp: ts,
    typeMessage: m.typeMessage,
    textMessage: m.textMessage ?? text,
    caption: m.caption ?? null,
    senderName: m.senderName ?? null,
    senderId: m.senderId ?? null,
    isFromMe,
    statusMessage: m.statusMessage ?? null,
    chatMeta: {
      name: m.groupName || null,
      contactName: undefined,
      chatType: m.isGroup || chatId.endsWith('@g.us') ? 'group' : 'user',
    },
  });
}

function extractTextFromMessageData(
  messageData: Record<string, unknown>
): string | null {
  const md = messageData as {
    textMessage?: string;
    textMessageData?: { textMessage?: string };
    extendedTextMessage?: { text?: string };
    extendedTextMessageData?: { text?: string };
    caption?: string;
    typeMessage?: string;
  };
  const text =
    md.textMessage ||
    md.textMessageData?.textMessage ||
    md.extendedTextMessage?.text ||
    md.extendedTextMessageData?.text ||
    md.caption ||
    null;
  return text != null && String(text).trim() ? String(text) : null;
}

/**
 * Green API incomingMessageReceived — persist for admin inbox (all chats).
 */
export async function upsertWaAdminFromIncomingWebhook(
  payload: Record<string, unknown>
): Promise<void> {
  const messageData = payload.messageData as
    | Record<string, unknown>
    | undefined;
  const senderData = payload.senderData as Record<string, unknown> | undefined;
  const idMessage = payload.idMessage as string | undefined;
  const timestamp = payload.timestamp as number | undefined;

  if (!messageData || !idMessage || timestamp == null) return;

  const chatId =
    (senderData?.chatId as string | undefined) ||
    (messageData.chatId as string | undefined);
  if (!chatId) return;

  const text = extractTextFromMessageData(messageData);
  const typeMessage = (messageData.typeMessage as string) || 'textMessage';
  const caption = (messageData.caption as string | undefined) || null;

  const chatName: string | null =
    senderData?.chatName != null
      ? String(senderData.chatName).trim() || null
      : null;
  const contactName: string | null =
    senderData?.senderContactName != null
      ? String(senderData.senderContactName).trim() || null
      : null;

  await upsertWaAdminMessage({
    waMessageId: idMessage,
    chatId,
    timestamp: BigInt(timestamp),
    typeMessage,
    textMessage: text,
    caption: caption || null,
    senderName: (senderData?.senderName as string) || null,
    senderId: (senderData?.sender as string) || null,
    isFromMe: false,
    statusMessage: null,
    chatMeta: {
      name: chatName,
      contactName: contactName || undefined,
      chatType: chatId.endsWith('@g.us') ? 'group' : 'user',
    },
    rawPayload: payload,
  });
}

/**
 * Green API outgoingMessageReceived — messages sent from phone/API appear here.
 */
export async function upsertWaAdminFromOutgoingWebhook(
  payload: Record<string, unknown>
): Promise<void> {
  const messageData = payload.messageData as
    | Record<string, unknown>
    | undefined;
  const senderData = payload.senderData as Record<string, unknown> | undefined;
  const idMessage = payload.idMessage as string | undefined;
  const timestamp = payload.timestamp as number | undefined;

  if (!messageData || !idMessage || timestamp == null) return;

  const chatId = (senderData?.chatId as string | undefined) || null;
  if (!chatId) return;

  const text = extractTextFromMessageData(messageData);
  const typeMessage = (messageData.typeMessage as string) || 'textMessage';
  const caption = (messageData.caption as string | undefined) || null;
  const statusMessage =
    (messageData.statusMessage as string | undefined) || null;

  const chatNameOut: string | null =
    senderData?.chatName != null
      ? String(senderData.chatName).trim() || null
      : null;

  await upsertWaAdminMessage({
    waMessageId: idMessage,
    chatId,
    timestamp: BigInt(timestamp),
    typeMessage,
    textMessage: text,
    caption,
    senderName: (senderData?.senderName as string) || null,
    senderId: (senderData?.sender as string) || null,
    isFromMe: true,
    statusMessage,
    chatMeta: {
      name: chatNameOut,
      contactName: undefined,
      chatType: chatId.endsWith('@g.us') ? 'group' : 'user',
    },
    rawPayload: payload,
  });
}

async function getUnreadAfterTimestamp(
  userId: string,
  chatId: string
): Promise<bigint> {
  let state = await prisma.waAdminChatReadState.findUnique({
    where: { userId_chatId: { userId, chatId } },
  });
  if (!state) {
    const last = await prisma.waAdminMessage.findFirst({
      where: { chatId },
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true, waMessageId: true },
    });
    if (!last) return BigInt(0);
    state = await prisma.waAdminChatReadState.upsert({
      where: { userId_chatId: { userId, chatId } },
      create: {
        userId,
        chatId,
        lastReadMessageTs: last.timestamp,
        lastReadWaMessageId: last.waMessageId,
      },
      update: {
        lastReadMessageTs: last.timestamp,
        lastReadWaMessageId: last.waMessageId,
      },
    });
  }
  return state.lastReadMessageTs;
}

export async function countUnreadIncoming(
  userId: string,
  chatId: string
): Promise<number> {
  const after = await getUnreadAfterTimestamp(userId, chatId);
  return prisma.waAdminMessage.count({
    where: {
      chatId,
      isFromMe: false,
      timestamp: { gt: after },
    },
  });
}

export async function countUnreadIncomingMedia(
  userId: string,
  chatId: string
): Promise<number> {
  const after = await getUnreadAfterTimestamp(userId, chatId);
  return prisma.waAdminMessage.count({
    where: {
      chatId,
      isFromMe: false,
      timestamp: { gt: after },
      typeMessage: { in: [...INCOMING_MEDIA_TYPES] },
    },
  });
}

/**
 * Unread counts for many chats in O(1) DB round-trips (avoids per-chat COUNT + read-state upserts).
 * Threshold when read state is missing: max(message.timestamp) for that chat (same as “caught up”, unread 0).
 */
export async function batchUnreadCountsForChats(
  userId: string,
  chatIds: string[]
): Promise<Map<string, { unread: number; unreadMedia: number }>> {
  const out = new Map<string, { unread: number; unreadMedia: number }>();
  if (chatIds.length === 0) return out;

  for (const id of chatIds) {
    out.set(id, { unread: 0, unreadMedia: 0 });
  }

  const [states, maxTsRows] = await Promise.all([
    prisma.waAdminChatReadState.findMany({
      where: { userId, chatId: { in: chatIds } },
      select: { chatId: true, lastReadMessageTs: true },
    }),
    prisma.waAdminMessage.groupBy({
      by: ['chatId'],
      where: { chatId: { in: chatIds } },
      _max: { timestamp: true },
    }),
  ]);

  const stateMap = new Map(
    states.map(s => [s.chatId, s.lastReadMessageTs] as const)
  );
  const maxMap = new Map(
    maxTsRows.map(m => [m.chatId, m._max.timestamp ?? BigInt(0)] as const)
  );

  const valueRows = chatIds.map(id => {
    const s = stateMap.get(id);
    const th = s !== undefined ? s : (maxMap.get(id) ?? BigInt(0));
    return Prisma.sql`(${id}::text, ${th}::bigint)`;
  });
  const valuesSql = Prisma.join(valueRows, ', ');

  const rows = await prisma.$queryRaw<
    { chat_id: string; ur: bigint; urm: bigint }[]
  >(Prisma.sql`
    WITH th("chat_id", thresh) AS (VALUES ${valuesSql})
    SELECT
      th."chat_id",
      COALESCE(SUM(CASE WHEN NOT m."isFromMe" AND m."timestamp" > th.thresh THEN 1 ELSE 0 END), 0)::bigint AS ur,
      COALESCE(SUM(CASE
        WHEN NOT m."isFromMe" AND m."timestamp" > th.thresh
          AND m."typeMessage" IN ('imageMessage','stickerMessage','videoMessage')
        THEN 1 ELSE 0 END), 0)::bigint AS urm
    FROM th
    LEFT JOIN "WaAdminMessage" m ON m."chatId" = th."chat_id"
    GROUP BY th."chat_id", th.thresh
  `);

  for (const row of rows) {
    out.set(row.chat_id, {
      unread: Number(row.ur),
      unreadMedia: Number(row.urm),
    });
  }
  return out;
}

export async function markWaAdminChatRead(
  userId: string,
  chatId: string
): Promise<void> {
  const agg = await prisma.waAdminMessage.aggregate({
    where: { chatId },
    _max: { timestamp: true },
  });
  const maxTs = agg._max.timestamp ?? BigInt(0);
  const last = await prisma.waAdminMessage.findFirst({
    where: { chatId },
    orderBy: { timestamp: 'desc' },
    select: { waMessageId: true, timestamp: true },
  });

  await prisma.waAdminChatReadState.upsert({
    where: { userId_chatId: { userId, chatId } },
    create: {
      userId,
      chatId,
      lastReadMessageTs: maxTs,
      lastReadWaMessageId: last?.waMessageId ?? null,
    },
    update: {
      lastReadMessageTs: maxTs,
      lastReadWaMessageId: last?.waMessageId ?? null,
    },
  });
}

/** Changes when any inbox message row is inserted (for SSE refresh). */
export async function getInboxEventVersion(): Promise<string> {
  const row = await prisma.waAdminMessage.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true, id: true },
  });
  if (!row) return '0';
  return `${row.createdAt.getTime()}-${row.id}`;
}

export async function upsertWaAdminChatsFromContacts(
  rows: Array<{
    id: string;
    name: string;
    contactName?: string;
    type: 'user' | 'group';
  }>
): Promise<void> {
  for (const r of rows) {
    await prisma.waAdminChat.upsert({
      where: { chatId: r.id },
      create: {
        chatId: r.id,
        name: r.name || '',
        contactName: r.contactName?.trim() || null,
        chatType: r.type === 'group' ? 'group' : 'user',
        lastActivityAt: new Date(0),
      },
      update: {
        name: r.name || '',
        contactName: r.contactName?.trim() || null,
        chatType: r.type === 'group' ? 'group' : 'user',
      },
    });
  }
}

export function logWaAdminUpsertSkipped(reason: string): void {
  logger.debug(`[wa-admin-inbox] skip: ${reason}`);
}

/** Merge Green API journal rows into inbox (used by cold sync). */
export async function upsertWaAdminFromJournalRows(
  incoming: Array<{
    chatId?: string;
    idMessage?: string;
    timestamp?: number;
    typeMessage?: string;
    textMessage?: string;
    caption?: string;
    senderName?: string;
    senderId?: string;
  }>,
  outgoing: Array<{
    chatId?: string;
    idMessage?: string;
    timestamp?: number;
    typeMessage?: string;
    textMessage?: string;
    caption?: string;
    statusMessage?: string;
  }>
): Promise<void> {
  for (const row of incoming) {
    if (!row.chatId || !row.idMessage || row.timestamp == null) continue;
    await upsertWaAdminMessage({
      waMessageId: row.idMessage,
      chatId: row.chatId,
      timestamp: BigInt(row.timestamp),
      typeMessage: row.typeMessage ?? null,
      textMessage: row.textMessage ?? null,
      caption: row.caption ?? null,
      senderName: row.senderName ?? null,
      senderId: row.senderId ?? null,
      isFromMe: false,
      statusMessage: null,
      chatMeta: {
        chatType: row.chatId.endsWith('@g.us') ? 'group' : 'user',
      },
    });
  }
  for (const row of outgoing) {
    if (!row.chatId || !row.idMessage || row.timestamp == null) continue;
    await upsertWaAdminMessage({
      waMessageId: row.idMessage,
      chatId: row.chatId,
      timestamp: BigInt(row.timestamp),
      typeMessage: row.typeMessage ?? null,
      textMessage: row.textMessage ?? null,
      caption: row.caption ?? null,
      senderName: null,
      senderId: null,
      isFromMe: true,
      statusMessage: row.statusMessage ?? null,
      chatMeta: {
        chatType: row.chatId.endsWith('@g.us') ? 'group' : 'user',
      },
    });
  }
}
