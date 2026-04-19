/**
 * Human-readable text from Green API `messageData` (webhooks / stored rawPayload).
 * Keeps admin inbox + client preview in sync.
 */

function pickStr(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

/** Primary text/caption fields used across message types. */
export function extractDeepText(md: Record<string, unknown>): string | null {
  return (
    pickStr(md.textMessage) ||
    pickStr(
      (md.textMessageData as Record<string, unknown> | undefined)?.textMessage
    ) ||
    pickStr(
      (md.extendedTextMessage as Record<string, unknown> | undefined)?.text
    ) ||
    pickStr(
      (md.extendedTextMessageData as Record<string, unknown> | undefined)?.text
    ) ||
    pickStr(md.caption) ||
    pickStr(
      (md.fileMessageData as Record<string, unknown> | undefined)?.caption
    ) ||
    pickStr(
      (md.imageMessageData as Record<string, unknown> | undefined)?.caption
    ) ||
    pickStr(
      (md.videoMessageData as Record<string, unknown> | undefined)?.caption
    ) ||
    pickStr(
      (md.documentMessageData as Record<string, unknown> | undefined)?.caption
    ) ||
    null
  );
}

/**
 * Short preview of the quoted / reacted-to message (nested `quotedMessage` object).
 */
export function extractQuotedMessageBodySnippet(q: unknown): string | null {
  if (!q || typeof q !== 'object') return null;
  const o = q as Record<string, unknown>;
  const nested = extractDeepText(o);
  if (nested) return nested.length > 200 ? `${nested.slice(0, 197)}…` : nested;

  const t = pickStr(o.typeMessage);
  const cap = extractDeepText(o) || pickStr(o.caption);
  if (cap) return cap;

  if (t === 'imageMessage' || t === 'videoMessage') {
    return t === 'imageMessage' ? '📷 Фото' : '🎬 Видео';
  }
  if (t === 'stickerMessage') return '🎨 Стикер';
  if (t === 'pttMessage' || t === 'audioMessage') return '🎤 Аудио';
  if (t === 'documentMessage') {
    const fn =
      pickStr(o.fileName) ||
      pickStr(
        (o.fileMessageData as Record<string, unknown> | undefined)?.fileName
      );
    return fn ? `📎 ${fn}` : '📎 Документ';
  }
  if (t === 'locationMessage') return '📍 Местоположение';
  const conv = pickStr(
    (o as { conversation?: unknown }).conversation as string | undefined
  );
  if (conv) return conv;
  return null;
}

/** Короткая подпись по JID (как в шапке чата, если имени нет). */
function jidShortLabel(jid: string): string {
  const s = jid.trim();
  const m = s.match(/^(\d{6,})@/);
  if (m) return `+${m[1]}`;
  const at = s.indexOf('@');
  if (at > 0 && at <= 48) return s.slice(0, at);
  return s;
}

/** Имя автора цитируемого сообщения (для превью ответа). */
export function extractQuotedAuthorLabel(q: unknown): string | null {
  if (!q || typeof q !== 'object') return null;
  const o = q as Record<string, unknown>;
  if (o.isFromMe === true || o.fromMe === true) return 'Я';
  const key = o.key;
  if (key && typeof key === 'object') {
    const k = key as Record<string, unknown>;
    if (k.fromMe === true || k.fromMe === 'true') return 'Я';
  }
  const name =
    pickStr(o.senderName) ||
    pickStr(o.pushName) ||
    pickStr((o as { notify?: unknown }).notify as string | undefined);
  if (name) return name;
  const part = pickStr(o.participant);
  if (part) return jidShortLabel(part);
  return null;
}

function unwrapEphemeral(
  md: Record<string, unknown>
): Record<string, unknown> | null {
  const inner = md.ephemeralMessage as Record<string, unknown> | undefined;
  if (inner && typeof inner === 'object') return inner;
  const v = md.viewOnceMessage as Record<string, unknown> | undefined;
  if (v && typeof v === 'object') {
    const inner2 = v.message as Record<string, unknown> | undefined;
    if (inner2 && typeof inner2 === 'object') return inner2;
  }
  return null;
}

function locationLine(md: Record<string, unknown>): string | null {
  const loc =
    (md.locationMessageData as Record<string, unknown> | undefined) ||
    (md.locationMessage as Record<string, unknown> | undefined) ||
    md;
  const name =
    pickStr(loc.name) ||
    pickStr(loc.address) ||
    pickStr((loc as { displayName?: string }).displayName);
  if (name) return `📍 ${name}`;
  const lat =
    (loc as { degreesLatitude?: number }).degreesLatitude ??
    (loc as { latitude?: number }).latitude;
  const lng =
    (loc as { degreesLongitude?: number }).degreesLongitude ??
    (loc as { longitude?: number }).longitude;
  if (lat != null && lng != null) return `📍 ${lat}, ${lng}`;
  return '📍 Местоположение';
}

function contactLine(md: Record<string, unknown>): string | null {
  const c =
    (md.contactMessageData as Record<string, unknown> | undefined) ||
    (md.contactsArrayMessageData as Record<string, unknown> | undefined) ||
    (md.contactMessage as Record<string, unknown> | undefined);
  if (c && typeof c === 'object') {
    const display = pickStr((c as { displayName?: string }).displayName);
    if (display) return `👤 ${display}`;
  }
  return '👤 Контакт';
}

function pollLine(md: Record<string, unknown>): string | null {
  const p =
    (md.pollCreationMessageData as Record<string, unknown> | undefined) ||
    (md.pollUpdateMessageData as Record<string, unknown> | undefined) ||
    (md.message as Record<string, unknown> | undefined);
  const name = p ? pickStr((p as { name?: string }).name) : null;
  if (name) return `📊 Опрос: ${name}`;
  return '📊 Опрос';
}

function listOrButtonsLine(md: Record<string, unknown>): string | null {
  const list =
    (md.listResponseMessage as Record<string, unknown> | undefined) ||
    (md.listResponseMessageData as Record<string, unknown> | undefined);
  if (list) {
    const row = list.singleSelectReply as Record<string, unknown> | undefined;
    const title =
      row && pickStr(row.title ?? row.description ?? row.selectedRowId);
    if (title) return `📋 ${title}`;
    return '📋 Ответ';
  }
  const bt =
    (md.buttonsResponseMessage as Record<string, unknown> | undefined) ||
    (md.templateButtonReplyMessage as Record<string, unknown> | undefined);
  const sel = bt ? pickStr(bt.selectedDisplayText ?? bt.selectedId) : null;
  if (sel) return `🔘 ${sel}`;
  return null;
}

/**
 * One line for chat list preview + bubble fallback when `textMessage` was not denormalized.
 */
export function extractGreenInboundDisplayText(
  md: Record<string, unknown>,
  depth = 0
): string | null {
  if (depth > 8) return null;
  const unwrapped = unwrapEphemeral(md);
  if (unwrapped) {
    const inner = extractGreenInboundDisplayText(unwrapped, depth + 1);
    if (inner) return inner;
  }

  const tm = String(md.typeMessage || '');

  if (tm === 'reactionMessage') {
    const emoji = pickStr(
      (md.extendedTextMessageData as Record<string, unknown> | undefined)
        ?.text as string | undefined
    );
    if (emoji) return `Реакция ${emoji}`;
    return 'Реакция';
  }

  if (tm === 'protocolMessage') {
    const ev = pickStr(
      (md.protocolMessage as Record<string, unknown> | undefined)?.type
    );
    if (ev) return `Системное: ${ev}`;
    return 'Системное сообщение';
  }

  const direct = extractDeepText(md);
  if (direct) return direct;

  if (tm === 'quotedMessage' && md.quotedMessage) {
    const q = extractQuotedMessageBodySnippet(md.quotedMessage);
    if (q) return q;
  }

  if (tm === 'locationMessage' || tm === 'liveLocationMessage') {
    return locationLine(md);
  }

  if (
    tm === 'contactMessage' ||
    tm === 'contactsArrayMessage' ||
    tm === 'contactsMessage'
  ) {
    return contactLine(md);
  }

  if (tm.includes('poll')) {
    return pollLine(md);
  }

  const listBtn = listOrButtonsLine(md);
  if (listBtn) return listBtn;

  if (tm === 'documentMessage' || tm === 'documentWithCaptionMessage') {
    const fn =
      pickStr(md.fileName) ||
      pickStr(
        (md.fileMessageData as Record<string, unknown> | undefined)?.fileName
      );
    if (fn) return `📎 ${fn}`;
    return '📎 Документ';
  }

  if (tm === 'imageMessage') return '📷 Фото';
  if (tm === 'videoMessage') return '🎬 Видео';
  if (tm === 'stickerMessage') return '🎨 Стикер';
  if (tm === 'audioMessage') return '🎵 Аудио';
  if (tm === 'pttMessage') return '🎤 Голосовое сообщение';
  if (tm === 'gifMessage') return '🎞 GIF';

  return null;
}

export function getMessageDataFromWebhookRaw(
  raw: unknown
): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const md = (raw as { messageData?: unknown }).messageData;
  if (md && typeof md === 'object') return md as Record<string, unknown>;
  return null;
}

/** Поля `messageData`, где у WhatsApp может быть `contextInfo` (ответ). */
const MESSAGE_BLOCKS_WITH_CONTEXT = [
  'extendedTextMessageData',
  'extendedTextMessage',
  'imageMessage',
  'imageMessageData',
  'videoMessage',
  'videoMessageData',
  'documentMessage',
  'documentMessageData',
  'audioMessage',
  'pttMessage',
  'buttonsMessage',
] as const;

function stanzaIdFromContextInfo(ci: unknown): string | null {
  if (!ci || typeof ci !== 'object') return null;
  const c = ci as Record<string, unknown>;
  return pickStr(c.stanzaId) ?? pickStr(c.stanzaID);
}

function extractQuotedStanzaIdFromMessageData(
  md: Record<string, unknown>
): string | null {
  const top = stanzaIdFromContextInfo(md.contextInfo);
  if (top) return top;
  for (const key of MESSAGE_BLOCKS_WITH_CONTEXT) {
    const block = md[key as string];
    if (!block || typeof block !== 'object') continue;
    const sid = stanzaIdFromContextInfo(
      (block as Record<string, unknown>).contextInfo
    );
    if (sid) return sid;
  }
  const qm = md.quotedMessage;
  if (qm && typeof qm === 'object') {
    const q = qm as Record<string, unknown>;
    const sid =
      pickStr(q.stanzaId) ?? pickStr(q.idMessage) ?? pickStr(q.id);
    if (sid) return sid;
  }
  return null;
}

/**
 * ID сообщения, на которое отвечают (как в БД / `waMessageId`), из вебхука Green API.
 */
export function extractQuotedTargetMessageId(raw: unknown): string | null {
  const walk = (
    md: Record<string, unknown> | null,
    depth: number
  ): string | null => {
    if (!md || depth > 8) return null;
    const sid = extractQuotedStanzaIdFromMessageData(md);
    if (sid) return sid;
    const uw = unwrapEphemeral(md);
    if (uw) return walk(uw, depth + 1);
    return null;
  };
  const md = getMessageDataFromWebhookRaw(raw);
  return walk(md, 0);
}

/**
 * Вложенный объект цитируемого сообщения (для превью), если не только `messageData.quotedMessage`.
 */
export function getQuotedMessageObjectForPreview(raw: unknown): unknown | null {
  let md = getMessageDataFromWebhookRaw(raw);
  if (!md) return null;
  for (let depth = 0; depth < 5 && md; depth++) {
    if (md.quotedMessage) return md.quotedMessage;
    for (const key of MESSAGE_BLOCKS_WITH_CONTEXT) {
      const block = md[key as string];
      if (!block || typeof block !== 'object') continue;
      const ci = (block as Record<string, unknown>).contextInfo;
      if (ci && typeof ci === 'object') {
        const q = (ci as Record<string, unknown>).quotedMessage;
        if (q) return q;
      }
    }
    if (md.contextInfo && typeof md.contextInfo === 'object') {
      const q = (md.contextInfo as Record<string, unknown>).quotedMessage;
      if (q) return q;
    }
    const next = unwrapEphemeral(md);
    if (!next) break;
    md = next;
  }
  return null;
}

function findContextInfoForReply(
  md: Record<string, unknown>
): Record<string, unknown> | null {
  const tryOne = (m: Record<string, unknown>): Record<string, unknown> | null => {
    const top = m.contextInfo;
    if (top && typeof top === 'object') {
      const c = top as Record<string, unknown>;
      if (
        c.quotedMessage != null ||
        pickStr(c.stanzaId) ||
        pickStr(c.stanzaID)
      ) {
        return c;
      }
    }
    for (const key of MESSAGE_BLOCKS_WITH_CONTEXT) {
      const block = m[key as string];
      if (!block || typeof block !== 'object') continue;
      const ci = (block as Record<string, unknown>).contextInfo;
      if (!ci || typeof ci !== 'object') continue;
      const c = ci as Record<string, unknown>;
      if (
        c.quotedMessage != null ||
        pickStr(c.stanzaId) ||
        pickStr(c.stanzaID)
      ) {
        return c;
      }
    }
    return null;
  };
  let cur: Record<string, unknown> | null = md;
  for (let depth = 0; depth < 5 && cur; depth++) {
    const hit = tryOne(cur);
    if (hit) return hit;
    const next = unwrapEphemeral(cur);
    cur = next;
  }
  return null;
}

/**
 * Имя в превью ответа: «Я» для своих, иначе имя / JID из quotedMessage или contextInfo.participant.
 * Всегда непустая строка (как в WhatsApp).
 */
export function resolveQuotedAuthorLabel(
  raw: unknown,
  quotedObj: unknown | null
): string {
  if (quotedObj) {
    const a = extractQuotedAuthorLabel(quotedObj);
    if (a) return a;
  }
  const md = getMessageDataFromWebhookRaw(raw);
  if (md) {
    const ci = findContextInfoForReply(md);
    if (ci) {
      const p =
        pickStr(ci.participant) ||
        pickStr(
          (ci as { quotedParticipant?: unknown }).quotedParticipant as
            | string
            | undefined
        );
      if (p) return jidShortLabel(p);
    }
  }
  return 'Контакт';
}

/** Эмодзи из `reactionMessage` (пусто = снятие реакции в WhatsApp). */
export function extractReactionEmojiFromRawPayload(
  raw: unknown
): string | null {
  const md = getMessageDataFromWebhookRaw(raw);
  if (!md || String(md.typeMessage) !== 'reactionMessage') return null;
  const ex = md.extendedTextMessageData as Record<string, unknown> | undefined;
  const ex2 = md.extendedTextMessage as Record<string, unknown> | undefined;
  const t =
    pickStr(ex?.text as string | undefined) ??
    pickStr(ex2?.text as string | undefined);
  return t?.trim() ? t.trim() : null;
}

/** Сообщение, на которое поставили реакцию (`contextInfo.stanzaId`). */
export function extractReactionTargetMessageId(raw: unknown): string | null {
  return extractQuotedTargetMessageId(raw);
}
