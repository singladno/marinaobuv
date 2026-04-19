import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db-node';
import { logServerError, logger } from '@/lib/server/logger';
import {
  extractDeepText,
  extractGreenInboundDisplayText,
  getMessageDataFromWebhookRaw,
} from '@/lib/wa-admin-green-message-text';
import { mirrorWebhookMediaIfNeeded } from '@/lib/wa-admin-media-s3';

function safeExtractStoredText(
  messageData: Record<string, unknown>
): string | null {
  try {
    return (
      extractGreenInboundDisplayText(messageData) ??
      extractDeepText(messageData) ??
      null
    );
  } catch (e) {
    logServerError('[wa-admin-inbox] message text extract failed:', e);
    try {
      return extractDeepText(messageData) ?? null;
    } catch {
      return null;
    }
  }
}

/** Входящие «картинки» для бейджа: фото, стикеры, видео. */
const INCOMING_MEDIA_TYPES = [
  'imageMessage',
  'stickerMessage',
  'videoMessage',
] as const;

const MEDIA_PREVIEW_EMOJI: Record<string, string> = {
  imageMessage: '📷',
  stickerMessage: '🎨',
  videoMessage: '🎬',
  documentMessage: '📎',
  audioMessage: '🎵',
  pttMessage: '🎤',
  gifMessage: '🎞',
};

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
  /** Public CDN URL after S3 mirror (webhook media). */
  mediaS3Url?: string | null;
};

function previewFromMessage(input: WaAdminUpsertInput): string {
  const t =
    (input.textMessage && input.textMessage.trim()) ||
    (input.caption && input.caption.trim()) ||
    '';
  if (t) return t.length > 120 ? `${t.slice(0, 117)}…` : t;
  if (input.mediaS3Url && input.typeMessage) {
    const emoji = MEDIA_PREVIEW_EMOJI[input.typeMessage];
    if (emoji) return emoji;
  }
  const md = getMessageDataFromWebhookRaw(input.rawPayload);
  if (md) {
    const d = extractGreenInboundDisplayText(md);
    if (d) return d.length > 120 ? `${d.slice(0, 117)}…` : d;
  }
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
        mediaS3Url: input.mediaS3Url ?? null,
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
        ...(input.mediaS3Url !== undefined
          ? { mediaS3Url: input.mediaS3Url }
          : {}),
        ...(input.rawPayload !== undefined
          ? { rawPayload: input.rawPayload as object }
          : {}),
      },
    });
  });
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

  const typeMessage = (messageData.typeMessage as string) || 'textMessage';
  const caption = (messageData.caption as string | undefined) || null;
  const text = safeExtractStoredText(messageData);

  const chatName: string | null =
    senderData?.chatName != null
      ? String(senderData.chatName).trim() || null
      : null;
  const contactName: string | null =
    senderData?.senderContactName != null
      ? String(senderData.senderContactName).trim() || null
      : null;

  const existing = await prisma.waAdminMessage.findUnique({
    where: { waMessageId: idMessage },
    select: { mediaS3Url: true },
  });

  /** Сначала пишем в БД — зеркалирование в S3 не должно блокировать вебхук при «висящем» downloadUrl. */
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
    mediaS3Url: existing?.mediaS3Url ?? undefined,
  });

  const mirrored = await mirrorWebhookMediaIfNeeded({
    waMessageId: idMessage,
    typeMessage,
    messageData,
    existingMediaS3Url: existing?.mediaS3Url,
  });
  if (mirrored && mirrored !== existing?.mediaS3Url) {
    await prisma.waAdminMessage.update({
      where: { waMessageId: idMessage },
      data: { mediaS3Url: mirrored },
    });
  }
}

/**
 * Green API: outgoingMessageReceived (phone) and outgoingAPIMessageReceived (sendMessage API).
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

  const typeMessage = (messageData.typeMessage as string) || 'textMessage';
  const caption = (messageData.caption as string | undefined) || null;
  const text = safeExtractStoredText(messageData);
  const statusMessage =
    (messageData.statusMessage as string | undefined) || null;

  const chatNameOut: string | null =
    senderData?.chatName != null
      ? String(senderData.chatName).trim() || null
      : null;

  const existing = await prisma.waAdminMessage.findUnique({
    where: { waMessageId: idMessage },
    select: { mediaS3Url: true },
  });

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
    mediaS3Url: existing?.mediaS3Url ?? undefined,
  });

  const mirrored = await mirrorWebhookMediaIfNeeded({
    waMessageId: idMessage,
    typeMessage,
    messageData,
    existingMediaS3Url: existing?.mediaS3Url,
  });
  if (mirrored && mirrored !== existing?.mediaS3Url) {
    await prisma.waAdminMessage.update({
      where: { waMessageId: idMessage },
      data: { mediaS3Url: mirrored },
    });
  }
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
 *
 * If there is no `WaAdminChatReadState` row for (user, chat), we use threshold **0** so every
 * incoming message with `timestamp > 0` counts as unread. Using `max(timestamp)` here was wrong:
 * that value moves forward with each new webhook message, so `timestamp > thresh` was never true
 * and badges stayed at 0 for chats the user had never opened (no persisted read cursor).
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

  const states = await prisma.waAdminChatReadState.findMany({
    where: { userId, chatId: { in: chatIds } },
    select: { chatId: true, lastReadMessageTs: true },
  });

  const stateMap = new Map(
    states.map(s => [s.chatId, s.lastReadMessageTs] as const)
  );

  const valueRows = chatIds.map(id => {
    const s = stateMap.get(id);
    const th = s !== undefined ? s : BigInt(0);
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

/**
 * Исходящее/входящее для админ-чата: в `rawPayload` лежит полный вебхук Green API.
 * Если в БД `isFromMe` = false по умолчанию, но пришёл исходящий вебхук,
 * пузырь должен быть справа — иначе «ваши» сообщения выглядят как чужие.
 */
export function inferIsFromMeFromWaWebhookPayload(
  rawPayload: unknown,
  dbIsFromMe: boolean
): boolean {
  if (rawPayload && typeof rawPayload === 'object') {
    const tw = (rawPayload as Record<string, unknown>).typeWebhook;
    if (
      tw === 'outgoingMessageReceived' ||
      tw === 'outgoingAPIMessageReceived'
    )
      return true;
    if (tw === 'incomingMessageReceived') return false;
  }
  return Boolean(dbIsFromMe);
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
