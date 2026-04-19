'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import clsx from 'clsx';
import { Check, Loader2, Plus, X } from 'lucide-react';
import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { PhoneInput } from '@/components/auth/PhoneInput';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';
import {
  waAvatarIdbDelete,
  waAvatarIdbGet,
  waAvatarIdbGetMissing,
  waAvatarIdbPutMissing,
  waAvatarPeekMissing,
  waAvatarPeekSession,
  waAvatarPersistFromDecodedImage,
} from '@/lib/client/wa-avatar-idb';
import {
  waInboxIdbGetChats,
  waInboxIdbGetThread,
  waInboxIdbPutChats,
  waInboxIdbPutThread,
} from '@/lib/client/wa-inbox-idb';
import {
  extractGreenInboundDisplayText,
  extractQuotedMessageBodySnippet,
  resolveQuotedAuthorLabel,
  extractQuotedTargetMessageId,
  extractReactionEmojiFromRawPayload,
  extractReactionTargetMessageId,
  getMessageDataFromWebhookRaw,
  getQuotedMessageObjectForPreview,
} from '@/lib/wa-admin-green-message-text';
import { waInboxChatMatchesFilter } from '@/lib/wa-inbox-chat-search';

type WaChat = {
  id: string;
  name: string;
  contactName?: string;
  type: 'user' | 'group';
  unreadCount?: number;
  /** Непрочитанные входящие фото / стикеры / видео */
  unreadImageCount?: number;
  lastPreview?: string | null;
};

type PendingChatImage = {
  id: string;
  file: File;
  url: string;
};

/** Safari/iOS often leave `type` empty for HEIC; still show preview. */
function looksLikeImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  const t = file.type.toLowerCase();
  if (t === 'application/octet-stream' || t === '') {
    return /\.(jpe?g|jpeg|png|gif|webp|bmp|heic|heif|jfif|avif|tiff?)$/i.test(
      file.name
    );
  }
  return /\.(jpe?g|jpeg|png|gif|webp|bmp|heic|heif|jfif|avif|tiff?)$/i.test(
    file.name
  );
}

/** Temp id until Green API returns `idMessage` (optimistic bubble). */
const WA_OPTIMISTIC_MSG_PREFIX = '__wa_opt__:';

function isOptimisticPlaceholderId(id: string): boolean {
  return id.startsWith(WA_OPTIMISTIC_MSG_PREFIX);
}

function canShowLocalImagePreview(typeMessage: string | undefined): boolean {
  const t = typeMessage || '';
  return t === 'imageMessage' || t === 'stickerMessage' || t === 'gifMessage';
}

/** Main photo/video fills bubble width (no side inset), WhatsApp-style. */
function messageHasBleedMedia(m: WaMessage): boolean {
  const tm = m.typeMessage || '';
  if (tm === 'videoMessage') return Boolean(m.mediaS3Url);
  if (tm === 'imageMessage' || tm === 'stickerMessage' || tm === 'gifMessage') {
    return (
      Boolean(m.mediaS3Url) ||
      (Boolean(m.localPreviewUrl) && canShowLocalImagePreview(tm))
    );
  }
  return false;
}

/**
 * Attach blob URLs for outgoing images still waiting on S3 mirror; revoke when CDN URL appears.
 */
function mergeWaMessagesWithOutgoingBlobs(
  msgs: WaMessage[],
  blobByWaId: Map<string, string>
): WaMessage[] {
  return msgs.map(m => {
    const blob = blobByWaId.get(m.idMessage);
    if (blob && !m.mediaS3Url && canShowLocalImagePreview(m.typeMessage)) {
      return { ...m, localPreviewUrl: blob };
    }
    if (m.mediaS3Url && blobByWaId.has(m.idMessage)) {
      const u = blobByWaId.get(m.idMessage)!;
      URL.revokeObjectURL(u);
      blobByWaId.delete(m.idMessage);
    }
    return m;
  });
}

function stripClientOnlyMessageFields(msgs: WaMessage[]): WaMessage[] {
  return msgs.map(({ localPreviewUrl: _lp, ...rest }) => rest);
}

type WaMessage = {
  idMessage: string;
  timestamp: number;
  typeMessage: string;
  textMessage?: string;
  senderName?: string;
  senderId?: string;
  isFromMe?: boolean;
  caption?: string;
  /** Green API outgoing status: pending → read */
  statusMessage?: string;
  /** Публичный CDN после зеркалирования вебхук-медиа в S3 */
  mediaS3Url?: string;
  /** Blob URL until `mediaS3Url` exists (client-only; not persisted). */
  localPreviewUrl?: string;
  /** Вебхук Green API (цитаты, реакции, типы без denormalized текста). */
  rawPayload?: unknown;
};

/**
 * Inbox data: DB fed by webhooks + optional Green sync/merge.
 * Live UI: SSE `/api/admin/whatsapp/inbox/stream` (no Green API polling).
 */
function displayName(chat: WaChat): string {
  const n = (chat.name || '').trim();
  const c = (chat.contactName || '').trim();
  if (n) return n;
  if (c) return c;
  return chat.id;
}

function chatInitials(label: string): string {
  const t = label.trim();
  if (!t) return '?';
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]!.slice(0, 1) + parts[1]!.slice(0, 1)).toUpperCase();
  }
  return t.slice(0, 2).toUpperCase();
}

/**
 * Bump when avatar API semantics change (invalidates browser disk cache for the proxy URL).
 * Inline proxy + IndexedDB — см. `GET /api/admin/whatsapp/inbox/avatar?inline=1`.
 */
const AVATAR_LAZY_REV = '4';

/** Длительность enter/exit overlay + окна (см. transition duration-300). */
const WA_CHAT_PANEL_MS = 320;

function ChatRowAvatar({
  chatId,
  label,
  /** Элемент со скроллом списка чатов: фото не грузим, пока строка не в viewport. */
  scrollRootEl,
  /** Шапка открытого чата — грузим фото сразу, без IntersectionObserver. */
  eager = false,
  /** Чуть крупнее в шапке диалога. */
  sizeClass = 'h-10 w-10 text-[11px]',
}: {
  chatId: string;
  label: string;
  scrollRootEl?: HTMLDivElement | null;
  eager?: boolean;
  sizeClass?: string;
}) {
  const [broken, setBroken] = useState(false);
  const [photoReady, setPhotoReady] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | undefined>(undefined);
  const blobUrlRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initials = chatInitials(label);

  /** Пока нет root — не грузим фото; после ref на скролл — только если строка в видимой области. */
  const [inListViewport, setInListViewport] = useState(eager);

  useEffect(() => {
    if (eager) {
      setInListViewport(true);
      return;
    }
    if (!scrollRootEl) return;
    const target = containerRef.current;
    if (!target) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setInListViewport(true);
      },
      { root: scrollRootEl, rootMargin: '0px', threshold: 0.01 }
    );
    io.observe(target);
    return () => io.disconnect();
  }, [eager, scrollRootEl, chatId]);

  const proxyUrl = useMemo(
    () =>
      `/api/admin/whatsapp/inbox/avatar?chatId=${encodeURIComponent(chatId)}&inline=1&r=${AVATAR_LAZY_REV}`,
    [chatId]
  );

  useLayoutEffect(() => {
    setBroken(false);
    setPhotoReady(false);
    let cancelled = false;

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    if (!inListViewport) {
      setImgSrc(undefined);
      return () => {
        cancelled = true;
      };
    }

    const instant = waAvatarPeekSession(chatId);
    if (instant) {
      const u = URL.createObjectURL(instant);
      blobUrlRef.current = u;
      setImgSrc(u);
      return () => {
        cancelled = true;
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = null;
        }
      };
    }

    if (waAvatarPeekMissing(chatId)) {
      setImgSrc(undefined);
      return () => {
        cancelled = true;
      };
    }

    void Promise.all([
      waAvatarIdbGet(chatId),
      waAvatarIdbGetMissing(chatId),
    ]).then(([cached, missing]) => {
      if (cancelled) return;
      if (cached && cached.size > 0) {
        const u = URL.createObjectURL(cached);
        blobUrlRef.current = u;
        setImgSrc(u);
        return;
      }
      if (missing) {
        setImgSrc(undefined);
        return;
      }
      setImgSrc(proxyUrl);
    });

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [chatId, proxyUrl, inListViewport]);

  return (
    <div
      ref={containerRef}
      className={clsx(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 font-bold text-white shadow-sm',
        sizeClass
      )}
      aria-hidden
    >
      <span className="relative z-0 flex h-full w-full items-center justify-center">
        {initials}
      </span>
      {imgSrc && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element -- blob: или same-origin inline proxy
        <img
          src={imgSrc}
          alt=""
          className={clsx(
            'absolute inset-0 z-10 h-full w-full object-cover transition-opacity duration-150',
            photoReady ? 'opacity-100' : 'opacity-0'
          )}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={e => {
            setPhotoReady(true);
            const el = e.currentTarget;
            if (el.src.startsWith('blob:')) return;
            waAvatarPersistFromDecodedImage(el, chatId);
          }}
          onError={async () => {
            if (blobUrlRef.current) {
              URL.revokeObjectURL(blobUrlRef.current);
              blobUrlRef.current = null;
              await waAvatarIdbDelete(chatId);
              setImgSrc(proxyUrl);
              setPhotoReady(false);
              return;
            }
            try {
              const r = await fetch(proxyUrl, { credentials: 'include' });
              if (r.status === 404) {
                await waAvatarIdbPutMissing(chatId);
              }
            } catch {
              /* сеть — не кэшируем как «нет аватара» */
            }
            setImgSrc(undefined);
            setBroken(true);
            setPhotoReady(false);
          }}
        />
      ) : null}
    </div>
  );
}

function messagePlainText(m: WaMessage): string | null {
  const t = m.textMessage?.trim();
  if (t) return t;
  const c = m.caption?.trim();
  if (c) return c;
  return null;
}

function resolveMessageDisplayText(m: WaMessage): string | null {
  const direct = messagePlainText(m);
  if (direct) return direct;
  const tm = m.typeMessage || '';
  /** Не показывать автогенерируемые подписи вроде «📷 Фото» под медиа — только реальный caption/текст. */
  if (
    tm === 'imageMessage' ||
    tm === 'stickerMessage' ||
    tm === 'gifMessage' ||
    tm === 'videoMessage'
  ) {
    return null;
  }
  const md = getMessageDataFromWebhookRaw(m.rawPayload);
  if (md) {
    const parsed = extractGreenInboundDisplayText(md);
    if (parsed) {
      if (parsed === '📷 Фото' || parsed === '🎬 Видео') return null;
      return parsed;
    }
  }
  return null;
}

/** Текст, если нет тела — плейсхолдер типа (до зеркалирования в S3). */
function messageBodyFallback(m: WaMessage): string {
  if (m.mediaS3Url) return '';
  const md = getMessageDataFromWebhookRaw(m.rawPayload);
  if (md) {
    const t = extractGreenInboundDisplayText(md);
    if (t) return t;
  }
  if (m.typeMessage && m.typeMessage !== 'textMessage') {
    return `(${m.typeMessage})`;
  }
  return '—';
}

function WaMessageBubbleContent({
  m,
  onJumpToQuoted,
  bleedMedia = false,
  firstInBubbleGroup = true,
  /** When set (media bubbles): время/галочки внизу справа, не растягивают ширину пузыря. */
  footerMeta,
}: {
  m: WaMessage;
  onJumpToQuoted?: (waMessageId: string) => void;
  /** Extend image/video to bubble left/right (and top when first block). */
  bleedMedia?: boolean;
  /** Matches bubble corner radius (first vs stacked message in a group). */
  firstInBubbleGroup?: boolean;
  footerMeta?: ReactNode;
}) {
  const quotedObj = getQuotedMessageObjectForPreview(m.rawPayload);
  const quoteSnippet =
    quotedObj != null ? extractQuotedMessageBodySnippet(quotedObj) : null;
  const quotedAuthor = resolveQuotedAuthorLabel(m.rawPayload, quotedObj);
  const quotedTargetId = extractQuotedTargetMessageId(m.rawPayload);
  const canJumpToQuote = Boolean(
    quotedTargetId && onJumpToQuoted && quoteSnippet
  );
  const resolved = resolveMessageDisplayText(m);

  /** Как в WhatsApp: полоса слева, справа один блок с фоном — внутри имя автора и превью текста. */
  const quotePreviewInner = (
    <>
      <div
        className="w-[3px] shrink-0 self-stretch rounded-sm bg-emerald-700 dark:bg-emerald-400/90"
        aria-hidden
      />
      <div className="min-w-0 flex-1 rounded-r-md bg-emerald-50/95 px-2 py-1.5 text-left dark:bg-emerald-950/45">
        <p className="text-[11px] font-semibold leading-tight text-emerald-800 dark:text-emerald-300">
          {quotedAuthor}
        </p>
        <p
          className={clsx(
            'mt-0.5 text-[11px] leading-snug text-gray-800 dark:text-gray-200'
          )}
        >
          {quoteSnippet}
        </p>
      </div>
    </>
  );

  const quoteShellClass =
    'mb-1.5 flex w-full max-w-full min-w-0 items-stretch gap-0 overflow-hidden rounded-lg border border-emerald-200/60 text-left dark:border-emerald-800/45';

  return (
    <>
      {quoteSnippet ? (
        canJumpToQuote ? (
          <button
            type="button"
            className={clsx(
              quoteShellClass,
              'cursor-pointer transition-colors hover:border-emerald-300 hover:bg-emerald-50/40 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/30'
            )}
            onClick={() => onJumpToQuoted!(quotedTargetId!)}
          >
            {quotePreviewInner}
          </button>
        ) : (
          <div className={quoteShellClass}>{quotePreviewInner}</div>
        )
      ) : null}
      {m.mediaS3Url ||
      (m.localPreviewUrl && canShowLocalImagePreview(m.typeMessage)) ? (
        <div
          className={clsx(
            'relative w-max max-w-full',
            bleedMedia && 'p-1.5',
            bleedMedia && 'overflow-hidden rounded-lg',
            bleedMedia && !quoteSnippet && '-mt-1',
            bleedMedia && quoteSnippet && 'mt-0',
            bleedMedia ? 'mb-0' : 'mb-1'
          )}
        >
          <WaMessageMedia m={m} bleed={bleedMedia} />
          {isOptimisticPlaceholderId(m.idMessage) ? (
            <>
              <div
                className="pointer-events-none absolute inset-0 rounded bg-black/10 dark:bg-black/25"
                aria-hidden
              />
              <div className="pointer-events-none absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white shadow-md">
                <Loader2
                  className="h-4 w-4 shrink-0 animate-spin"
                  aria-hidden
                />
              </div>
            </>
          ) : null}
        </div>
      ) : null}
      {footerMeta &&
      (m.mediaS3Url ||
        (m.localPreviewUrl && canShowLocalImagePreview(m.typeMessage))) ? (
        <>
          {resolved ? (
            <div className="mt-1 flex w-full min-w-0 items-end justify-between gap-2">
              <p className="min-w-0 flex-1 whitespace-pre-wrap break-words">
                {resolved}
              </p>
              <div className="inline-flex shrink-0 translate-y-px items-center gap-0.5 text-[11px] tabular-nums leading-none text-[#667781] dark:text-[#94a9b3]">
                {footerMeta}
              </div>
            </div>
          ) : (
            <div className="mt-1 flex w-full justify-end">
              <div className="inline-flex shrink-0 translate-y-px items-center gap-0.5 text-[11px] tabular-nums leading-none text-[#667781] dark:text-[#94a9b3]">
                {footerMeta}
              </div>
            </div>
          )}
        </>
      ) : resolved ? (
        <p className="whitespace-pre-wrap break-words">{resolved}</p>
      ) : !m.mediaS3Url && !m.localPreviewUrl ? (
        <p className="whitespace-pre-wrap break-words">
          {messageBodyFallback(m)}
        </p>
      ) : null}
    </>
  );
}

function WaMessageMedia({
  m,
  bleed = false,
}: {
  m: WaMessage;
  bleed?: boolean;
}) {
  const url = m.mediaS3Url || m.localPreviewUrl;
  if (!url) return null;
  const tm = m.typeMessage;
  if (tm === 'imageMessage' || tm === 'stickerMessage' || tm === 'gifMessage') {
    const compact = tm === 'stickerMessage';
    return (
      // eslint-disable-next-line @next/next/no-img-element -- S3 CDN или blob превью
      <img
        src={url}
        alt=""
        loading={url.startsWith('blob:') ? 'eager' : 'lazy'}
        className={clsx(
          'block min-w-0',
          bleed
            ? clsx(
                'h-auto w-auto max-w-full rounded-none object-contain',
                compact ? 'max-h-40' : 'max-h-[min(22rem,70vh)]'
              )
            : clsx(
                'max-w-full rounded object-contain',
                compact ? 'max-h-40' : 'max-h-64'
              )
        )}
      />
    );
  }
  if (tm === 'videoMessage') {
    return (
      <video
        src={url}
        controls
        className={clsx(
          'block min-w-0',
          bleed
            ? 'h-auto max-h-[min(22rem,70vh)] w-auto max-w-full rounded-none object-contain'
            : 'max-h-64 max-w-full rounded'
        )}
        preload="metadata"
      />
    );
  }
  if (tm === 'audioMessage' || tm === 'pttMessage') {
    return <audio src={url} controls className="block w-full max-w-[260px]" />;
  }
  if (tm === 'documentMessage') {
    const md = getMessageDataFromWebhookRaw(m.rawPayload);
    const fd = md?.fileMessageData as { fileName?: string } | undefined;
    const name =
      (typeof md?.fileName === 'string' && md.fileName.trim()) ||
      (fd?.fileName && String(fd.fileName).trim()) ||
      'Документ';
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-[13px] font-medium text-emerald-800 underline dark:text-emerald-300"
      >
        {name}
      </a>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block text-[13px] font-medium text-emerald-800 underline dark:text-emerald-300"
    >
      Вложение
    </a>
  );
}

/** Time only, inside bubbles (no date — day is on the centered badge). */
function formatTimeOnly(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Centered day separator: «Сегодня», «Вчера», or short weekday + date. */
function formatDateBadge(ts: number, now = new Date()): string {
  const msg = new Date(ts * 1000);
  const msgDay = startOfDay(msg);
  const today = startOfDay(now);
  const yesterday = startOfDay(new Date(now.getTime() - 86400000));
  if (msgDay.getTime() === today.getTime()) return 'Сегодня';
  if (msgDay.getTime() === yesterday.getTime()) return 'Вчера';
  return msg.toLocaleDateString('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function showDateSeparatorBefore(
  messages: WaMessage[],
  index: number
): boolean {
  if (index === 0) return true;
  const a = new Date(messages[index - 1]!.timestamp * 1000);
  const b = new Date(messages[index]!.timestamp * 1000);
  return startOfDay(a).getTime() !== startOfDay(b).getTime();
}

/** First in a visual stack: new day, side change, or different sender (incoming groups). */
function isFirstInGroup(messages: WaMessage[], index: number): boolean {
  if (index === 0) return true;
  const prev = messages[index - 1]!;
  const cur = messages[index]!;
  if (showDateSeparatorBefore(messages, index)) return true;
  if (Boolean(prev.isFromMe) !== Boolean(cur.isFromMe)) return true;
  if (!cur.isFromMe && !prev.isFromMe) {
    const a = (prev.senderId ?? '').trim() || (prev.senderName ?? '');
    const b = (cur.senderId ?? '').trim() || (cur.senderName ?? '');
    if (a !== b) return true;
  }
  return false;
}

/** Green API `statusMessage` for outgoing messages (GetChatHistory) */
function outgoingStatusLabel(status?: string): string {
  const s = (status ?? '').toLowerCase();
  if (s === 'read') return 'Прочитано';
  if (s === 'delivered') return 'Доставлено';
  if (s === 'pending') return 'Отправка…';
  if (s === 'sent') return 'Отправлено';
  return 'Отправлено';
}

/**
 * WhatsApp-style delivery ticks on outgoing bubbles only.
 * Single ✓ ≈ sent; double ✓✓ gray ≈ delivered; double ✓✓ blue ≈ read.
 */
/** Разделитель как в Telegram: полная ширина, светлая полоса, над первым новым входящим. */
function NewMessagesDivider() {
  return (
    <div
      className="-mx-2.5 my-3 w-[calc(100%+1.25rem)] sm:-mx-3 sm:w-[calc(100%+1.5rem)]"
      role="separator"
      aria-label="Новые сообщения"
    >
      <div className="border-y border-white/60 bg-white/70 py-1.5 text-center text-[12px] font-medium text-gray-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-[1px] dark:border-white/10 dark:bg-gray-800/55 dark:text-gray-100 dark:shadow-none">
        Новые
      </div>
    </div>
  );
}

type WaReactionEntry = {
  emoji: string;
  reactionWaMessageId: string;
  senderName: string | null;
  senderId: string | null;
  isFromMe: boolean;
  timestamp: number;
};

/** Реакции не показываем отдельными пузырями — только здесь, по id целевого сообщения. */
function buildReactionsByTarget(
  all: WaMessage[]
): Map<string, WaReactionEntry[]> {
  const accum = new Map<string, Map<string, WaReactionEntry>>();
  for (const m of all) {
    if (m.typeMessage !== 'reactionMessage') continue;
    const targetId = extractReactionTargetMessageId(m.rawPayload);
    if (!targetId) continue;
    const emoji = extractReactionEmojiFromRawPayload(m.rawPayload);
    const senderKey =
      (m.senderId ?? '').trim() || m.idMessage || String(m.timestamp);
    if (!emoji) {
      const bySender = accum.get(targetId);
      if (bySender) {
        bySender.delete(senderKey);
        if (bySender.size === 0) accum.delete(targetId);
      }
      continue;
    }
    let bySender = accum.get(targetId);
    if (!bySender) {
      bySender = new Map();
      accum.set(targetId, bySender);
    }
    bySender.set(senderKey, {
      emoji,
      reactionWaMessageId: m.idMessage,
      senderName: m.senderName ?? null,
      senderId: m.senderId ?? null,
      isFromMe: Boolean(m.isFromMe),
      timestamp: m.timestamp,
    });
  }
  const out = new Map<string, WaReactionEntry[]>();
  for (const [targetId, bySender] of accum) {
    const list = [...bySender.values()].sort(
      (a, b) => a.timestamp - b.timestamp
    );
    if (list.length) out.set(targetId, list);
  }
  return out;
}

function reactionActorLabel(r: WaReactionEntry): string {
  if (r.isFromMe) return 'Вы';
  const n = (r.senderName ?? '').trim();
  if (n) return n;
  return (r.senderId ?? '').trim() || 'Участник';
}

function WaMessageReactionBadge({
  reactions,
  mine,
}: {
  reactions: WaReactionEntry[];
  mine: boolean;
}) {
  const [filter, setFilter] = useState<'all' | string>('all');
  const sumByEmoji = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reactions) {
      map.set(r.emoji, (map.get(r.emoji) ?? 0) + 1);
    }
    return map;
  }, [reactions]);

  const filtered = useMemo(
    () =>
      filter === 'all' ? reactions : reactions.filter(r => r.emoji === filter),
    [filter, reactions]
  );

  const total = reactions.length;
  const uniqueEmojis = [...sumByEmoji.keys()];
  const previewEmoji =
    uniqueEmojis.length <= 2
      ? uniqueEmojis.join('')
      : `${uniqueEmojis[0] ?? '👍'}…`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={clsx(
            'absolute z-10 flex min-h-[26px] max-w-[120px] items-center justify-center gap-0.5 rounded-full border border-gray-300/90 bg-white px-2 py-1 text-left shadow-md outline-none transition hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-violet-400/50 dark:border-gray-500 dark:bg-[#1f2c33] dark:hover:bg-gray-800',
            /* Исходящие — внизу справа, входящие — слева; чуть ниже края пузыря, как в WhatsApp. */
            mine ? 'bottom-[-12px] right-2' : 'bottom-[-12px] left-2'
          )}
          aria-label={`Реакции: ${total}`}
        >
          <span className="truncate text-[14px] leading-none">
            {previewEmoji}
          </span>
          {total > 1 && (
            <span className="shrink-0 text-[10px] font-semibold tabular-nums text-gray-600 dark:text-gray-300">
              {total}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={mine ? 'end' : 'start'}
        side="top"
        sideOffset={6}
        className="w-[min(18rem,calc(100vw-2rem))] border border-gray-200/90 bg-[#f0f2f5] p-0 shadow-lg dark:border-gray-600 dark:bg-[#1e2a30]"
      >
        <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-200/80 px-2 py-2 dark:border-gray-600">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={clsx(
              'rounded-full px-2.5 py-1 text-[11px] font-medium transition',
              filter === 'all'
                ? 'bg-gray-300/90 text-gray-900 dark:bg-gray-600 dark:text-gray-100'
                : 'text-gray-600 hover:bg-gray-200/80 dark:text-gray-300 dark:hover:bg-gray-700'
            )}
          >
            Все {total}
          </button>
          {[...sumByEmoji.entries()].map(([emoji, n]) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setFilter(f => (f === emoji ? 'all' : emoji))}
              className={clsx(
                'rounded-full px-2 py-0.5 text-[12px] transition',
                filter === emoji
                  ? 'bg-gray-300/90 dark:bg-gray-600'
                  : 'hover:bg-gray-200/80 dark:hover:bg-gray-700'
              )}
            >
              {emoji} {n}
            </button>
          ))}
        </div>
        <ul className="max-h-60 overflow-y-auto px-1 py-1.5">
          {filtered.map(r => (
            <li
              key={r.reactionWaMessageId}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] hover:bg-gray-200/60 dark:hover:bg-gray-700/50"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-300/80 text-[11px] font-semibold text-gray-700 dark:bg-gray-600 dark:text-gray-100"
                aria-hidden
              >
                {chatInitials(reactionActorLabel(r))}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900 dark:text-gray-100">
                  {reactionActorLabel(r)}
                </p>
              </div>
              <span className="shrink-0 text-[18px] leading-none" aria-hidden>
                {r.emoji}
              </span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

/** WhatsApp-style centered day pill */
function DateBadge({ label }: { label: string }) {
  return (
    <div className="my-4 flex w-full justify-center px-2">
      <span
        className="max-w-[90%] rounded-full bg-white/95 px-3 py-1 text-center text-[11px] font-semibold text-gray-800 shadow-sm dark:bg-gray-800/95 dark:text-gray-100"
        role="separator"
      >
        {label}
      </span>
    </div>
  );
}

function isLastInGroup(messages: WaMessage[], index: number): boolean {
  if (index >= messages.length - 1) return true;
  return isFirstInGroup(messages, index + 1);
}

function OutgoingDeliveryTicks({ status }: { status?: string }) {
  const s = (status ?? '').toLowerCase();
  const read = s === 'read';
  const delivered = s === 'delivered';
  const double = read || delivered;
  const label = outgoingStatusLabel(status);
  const tickClass = clsx(
    'h-3.5 w-3.5 shrink-0 stroke-[2.75]',
    read
      ? 'text-sky-500 dark:text-sky-400'
      : 'text-[#667781] dark:text-[#94a9b3]'
  );

  if (double) {
    return (
      <span
        className="inline-flex items-center justify-end"
        title={label}
        aria-label={label}
      >
        <Check className={clsx(tickClass, '-mr-[11px]')} aria-hidden />
        <Check className={tickClass} aria-hidden />
      </span>
    );
  }

  return (
    <span className="inline-flex items-center" title={label} aria-label={label}>
      <Check
        className="h-3.5 w-3.5 shrink-0 stroke-[2.75] text-[#667781] dark:text-[#94a9b3]"
        aria-hidden
      />
    </span>
  );
}

export type AdminWhatsAppChatPanelProps = {
  open: boolean;
  onClose: () => void;
};

/** WhatsApp admin inbox (Green API send + DB-backed list/messages). */
export function AdminWhatsAppChatPanel({
  open,
  onClose,
}: AdminWhatsAppChatPanelProps) {
  const [chats, setChats] = useState<WaChat[]>([]);
  const [chatFilter, setChatFilter] = useState('');
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [addFirstName, setAddFirstName] = useState('');
  const [addLastName, setAddLastName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addContactLoading, setAddContactLoading] = useState(false);
  const [addContactErr, setAddContactErr] = useState<string | null>(null);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [chatsError, setChatsError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WaMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingImages, setPendingImages] = useState<PendingChatImage[]>([]);
  const [readThroughTs, setReadThroughTs] = useState(0);

  /** Скролл-контейнер списка чатов: виртуализация + lazy-аватары по viewport. */
  const [chatListScrollEl, setChatListScrollEl] =
    useState<HTMLDivElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  /** Blob URLs for outgoing images until `mediaS3Url` exists (survives full list reloads). */
  const outgoingLocalBlobByWaIdRef = useRef<Map<string, string>>(new Map());
  /** Прокрутка к цитируемому сообщению по `waMessageId`. */
  const messageBubbleRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);
  const highlightClearTimeoutRef = useRef<number | null>(null);

  const jumpToQuotedMessage = useCallback((waMessageId: string) => {
    const el = messageBubbleRefs.current.get(waMessageId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (highlightClearTimeoutRef.current) {
      window.clearTimeout(highlightClearTimeoutRef.current);
    }
    setHighlightedMessageId(waMessageId);
    highlightClearTimeoutRef.current = window.setTimeout(() => {
      setHighlightedMessageId(null);
      highlightClearTimeoutRef.current = null;
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (highlightClearTimeoutRef.current) {
        window.clearTimeout(highlightClearTimeoutRef.current);
      }
    };
  }, []);

  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;

  const previousSelectedChatRef = useRef<string | null>(null);

  const chatsRequestBusy = useRef(false);
  /** Отменяет предыдущий fetch сообщений при новом запросе или смене чата (избегает гонок с selectedIdRef). */
  const messagesFetchAbortRef = useRef<AbortController | null>(null);
  const didColdSyncRef = useRef(false);

  /** In-memory last loaded thread per chat (instant switch back without network). */
  const threadMemoryRef = useRef(
    new Map<string, { messages: WaMessage[]; readThroughTs: number }>()
  );
  const messagesRef = useRef<WaMessage[]>([]);
  const readThroughTsRef = useRef(0);
  messagesRef.current = messages;
  readThroughTsRef.current = readThroughTs;

  /**
   * Порог readThroughTs для полоски «Новые» на время текущего визита в чат.
   * Берётся из первого GET /messages до POST /read; при смене чата сбрасывается,
   * чтобы после возврата линия не кешировалась поверх уже прочитанного.
   */
  const newMessagesDividerThresholdRef = useRef<Map<string, number>>(new Map());

  /** При каждом открытии модуля — ни один чат не выбран (state не сбрасывается при open=false, т.к. компонент остаётся смонтированным). */
  useLayoutEffect(() => {
    if (!open) return;
    setSelectedId(null);
    setDraft('');
    setPendingImages(prev => {
      prev.forEach(p => URL.revokeObjectURL(p.url));
      return [];
    });
    setMessagesError(null);
  }, [open]);

  /** Сброс черновика вложений только при смене чата (не при первом выборе). */
  useEffect(() => {
    const prev = previousSelectedChatRef.current;
    previousSelectedChatRef.current = selectedId;
    if (prev === null || prev === selectedId) return;
    setPendingImages(p => {
      if (p.length === 0) return p;
      p.forEach(x => URL.revokeObjectURL(x.url));
      return [];
    });
  }, [selectedId]);

  useEffect(() => {
    return () => {
      outgoingLocalBlobByWaIdRef.current.forEach(u => URL.revokeObjectURL(u));
      outgoingLocalBlobByWaIdRef.current.clear();
    };
  }, [selectedId]);

  useEffect(() => {
    if (open) return;
    outgoingLocalBlobByWaIdRef.current.forEach(u => URL.revokeObjectURL(u));
    outgoingLocalBlobByWaIdRef.current.clear();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (selectedIdRef.current) {
        e.preventDefault();
        setSelectedId(null);
        setDraft('');
        setPendingImages(prev => {
          prev.forEach(x => URL.revokeObjectURL(x.url));
          return [];
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  /** Плавное появление / исчезновение: `panelHold` держит DOM до конца exit-анимации. */
  const [panelHold, setPanelHold] = useState(false);
  const [enterReady, setEnterReady] = useState(false);
  const showPanel = open || panelHold;

  useLayoutEffect(() => {
    if (open) {
      setPanelHold(true);
      setEnterReady(false);
      const reduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) {
        setEnterReady(true);
        return;
      }
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setEnterReady(true));
      });
      return () => cancelAnimationFrame(id);
    }
    setEnterReady(false);
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open && panelHold) {
      const t = window.setTimeout(() => setPanelHold(false), WA_CHAT_PANEL_MS);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open, panelHold]);

  const loadChats = useCallback(
    async (opts?: { silent?: boolean }): Promise<number> => {
      const silent = Boolean(opts?.silent);
      /** Не отменяем silent-обновления (SSE): иначе второй вызов в том же тике мог вернуть -1 и список не обновится. */
      if (!silent && chatsRequestBusy.current) return -1;
      chatsRequestBusy.current = true;
      if (!silent) {
        setChatsLoading(true);
      }
      setChatsError(null);
      try {
        const res = await fetch('/api/admin/whatsapp/inbox/chats', {
          credentials: 'include',
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Не удалось загрузить чаты');
        }
        const list = Array.isArray(data.chats) ? data.chats : [];
        setChats(list);
        void waInboxIdbPutChats(list);
        return list.length;
      } catch (e) {
        if (!silent) {
          setChatsError(e instanceof Error ? e.message : 'Ошибка загрузки');
          setChats([]);
        }
        return 0;
      } finally {
        chatsRequestBusy.current = false;
        if (!silent) {
          setChatsLoading(false);
        }
      }
    },
    []
  );

  const loadMessages = useCallback(
    async (
      chatId: string,
      opts?: { silent?: boolean; freezeDividerBaseline?: boolean }
    ) => {
      const silent = Boolean(opts?.silent);
      const freezeDividerBaseline = Boolean(opts?.freezeDividerBaseline);
      messagesFetchAbortRef.current?.abort();
      const ac = new AbortController();
      messagesFetchAbortRef.current = ac;

      if (!silent) {
        setMessagesLoading(true);
      }
      setMessagesError(null);
      try {
        const params = new URLSearchParams({ chatId, limit: '500' });
        const res = await fetch(
          `/api/admin/whatsapp/inbox/messages?${params}`,
          {
            credentials: 'include',
            signal: ac.signal,
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Не удалось загрузить сообщения');
        }
        const rawMsgs: WaMessage[] = Array.isArray(data.messages)
          ? data.messages
          : [];
        const msgs = mergeWaMessagesWithOutgoingBlobs(
          rawMsgs,
          outgoingLocalBlobByWaIdRef.current
        );
        const meta: { readThroughTs?: number } = data;
        if (selectedIdRef.current === chatId) {
          const rts =
            typeof meta.readThroughTs === 'number' ? meta.readThroughTs : 0;
          if (freezeDividerBaseline) {
            newMessagesDividerThresholdRef.current.set(chatId, rts);
          }
          setMessages(msgs);
          setReadThroughTs(rts);
          const forCache = stripClientOnlyMessageFields(msgs);
          threadMemoryRef.current.set(chatId, {
            messages: forCache,
            readThroughTs: rts,
          });
          void waInboxIdbPutThread(chatId, {
            messages: forCache,
            readThroughTs: rts,
          });
        }
      } catch (e) {
        if (ac.signal.aborted) return;
        if (!silent) {
          setMessagesError(e instanceof Error ? e.message : 'Ошибка загрузки');
          /** Не очищаем ленту при сбое refetch — иначе после отправки сообщение «пропадает». */
        }
      } finally {
        if (messagesFetchAbortRef.current === ac) {
          messagesFetchAbortRef.current = null;
        }
        if (!silent) {
          setMessagesLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!open) {
      messagesFetchAbortRef.current?.abort();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      didColdSyncRef.current = false;
      return;
    }

    const ac = new AbortController();
    let cancelled = false;

    void (async () => {
      const cached = await waInboxIdbGetChats<WaChat>();
      if (cancelled || ac.signal.aborted) return;
      const hasCached = Boolean(cached && cached.length > 0);
      if (hasCached && cached) {
        setChats(cached);
      }

      const n = await loadChats({ silent: hasCached });
      if (cancelled || ac.signal.aborted) return;

      if (n === 0 && !didColdSyncRef.current) {
        didColdSyncRef.current = true;
        await fetch('/api/admin/whatsapp/inbox/sync', {
          method: 'POST',
          credentials: 'include',
          signal: ac.signal,
        });
        if (cancelled || ac.signal.aborted) return;
        await loadChats({ silent: true });
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [open, loadChats]);

  useEffect(() => {
    if (!open) return;
    if (!selectedId) {
      setMessages([]);
      setReadThroughTs(0);
      return;
    }

    const id = selectedId;
    const mem = threadMemoryRef.current.get(id);
    if (mem) {
      setMessages(mem.messages);
      setReadThroughTs(mem.readThroughTs);
      setMessagesError(null);
      setMessagesLoading(false);
    } else {
      setMessages([]);
      setMessagesLoading(true);
    }

    let cancelled = false;
    let networkSilent = Boolean(mem);

    void (async () => {
      let fromIdb: Awaited<ReturnType<typeof waInboxIdbGetThread<WaMessage>>> =
        null;
      if (!mem) {
        fromIdb = await waInboxIdbGetThread<WaMessage>(id);
        if (cancelled || selectedIdRef.current !== id) return;
        if (fromIdb?.messages?.length) {
          setMessages(fromIdb.messages);
          setReadThroughTs(fromIdb.readThroughTs);
          setMessagesLoading(false);
          setMessagesError(null);
          networkSilent = true;
        }
      }

      await loadMessages(id, {
        silent: networkSilent,
        freezeDividerBaseline: true,
      });
      if (cancelled || selectedIdRef.current !== id) return;

      await fetch('/api/admin/whatsapp/inbox/read', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: id }),
      });
      if (cancelled || selectedIdRef.current !== id) return;
      await loadChats({ silent: true });
      if (cancelled || selectedIdRef.current !== id) return;

      await loadMessages(id, { silent: true });
    })();

    return () => {
      cancelled = true;
      newMessagesDividerThresholdRef.current.delete(id);
      threadMemoryRef.current.set(id, {
        messages: messagesRef.current,
        readThroughTs: readThroughTsRef.current,
      });
      void waInboxIdbPutThread(id, {
        messages: messagesRef.current,
        readThroughTs: readThroughTsRef.current,
      });
    };
  }, [open, selectedId, loadMessages, loadChats]);

  /** SSE: inbox DB changed → refresh lists (no Green API). */
  useEffect(() => {
    if (!open || typeof EventSource === 'undefined') return;
    const es = new EventSource('/api/admin/whatsapp/inbox/stream');
    es.onmessage = () => {
      void loadChats({ silent: true });
      const sid = selectedIdRef.current;
      if (sid) {
        void (async () => {
          await fetch('/api/admin/whatsapp/inbox/read', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatId: sid }),
          });
          await loadMessages(sid, { silent: true });
          await loadChats({ silent: true });
        })();
      }
    };
    return () => es.close();
  }, [open, loadChats, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, selectedId]);

  const displayMessages = useMemo(
    () => messages.filter(m => m.typeMessage !== 'reactionMessage'),
    [messages]
  );

  const reactionsByTarget = useMemo(
    () => buildReactionsByTarget(messages),
    [messages]
  );

  const filteredChats = useMemo(
    () => chats.filter(c => waInboxChatMatchesFilter(c, chatFilter)),
    [chats, chatFilter]
  );

  const submitAddContact = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setAddContactErr(null);
      setAddContactLoading(true);
      try {
        const res = await fetch('/api/admin/whatsapp/contacts', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: addFirstName,
            lastName: addLastName.trim() || undefined,
            phone: addPhone,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            typeof data.error === 'string' ? data.error : 'Не удалось добавить'
          );
        }
        const newId = typeof data.chatId === 'string' ? data.chatId : undefined;
        setAddContactOpen(false);
        setAddFirstName('');
        setAddLastName('');
        setAddPhone('');
        await loadChats({ silent: false });
        if (newId) setSelectedId(newId);
      } catch (err) {
        setAddContactErr(
          err instanceof Error ? err.message : 'Ошибка сохранения'
        );
      } finally {
        setAddContactLoading(false);
      }
    },
    [addFirstName, addLastName, addPhone, loadChats]
  );

  const chatListVirtualizer = useVirtualizer({
    count: filteredChats.length,
    getScrollElement: () => chatListScrollEl,
    /** Typical row (avatar + 1–2 lines); avoid overstating — minHeight=vRow.size was adding empty slack when estimate > natural height. */
    estimateSize: () => 60,
    overscan: 6,
  });

  const lastChatListScrollSelection = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedId) {
      lastChatListScrollSelection.current = null;
      return;
    }
    if (!chatListScrollEl) return;
    if (lastChatListScrollSelection.current === selectedId) return;
    lastChatListScrollSelection.current = selectedId;
    const idx = filteredChats.findIndex(c => c.id === selectedId);
    if (idx < 0) return;
    chatListVirtualizer.scrollToIndex(idx, { align: 'auto' });
  }, [selectedId, filteredChats, chatListScrollEl, chatListVirtualizer]);

  const selectedChat = useMemo(
    () => chats.find(c => c.id === selectedId) ?? null,
    [chats, selectedId]
  );

  /** Одна строка по умолчанию; Shift+Enter — новая строка; рост до ~5 строк. */
  const MESSAGE_INPUT_ONE_LINE_PX = 34;
  const MESSAGE_INPUT_MAX_PX = 160;
  const adjustMessageInputHeight = useCallback(() => {
    const el = messageInputRef.current;
    if (!el) return;
    el.style.height = `${MESSAGE_INPUT_ONE_LINE_PX}px`;
    el.style.height = `${Math.min(el.scrollHeight, MESSAGE_INPUT_MAX_PX)}px`;
  }, []);

  useLayoutEffect(() => {
    adjustMessageInputHeight();
  }, [draft, pendingImages.length, adjustMessageInputHeight]);

  const removePendingImage = useCallback((id: string) => {
    setPendingImages(prev => {
      const x = prev.find(p => p.id === id);
      if (x) URL.revokeObjectURL(x.url);
      return prev.filter(p => p.id !== id);
    });
  }, []);

  const appendImagesFromFileList = useCallback((list: FileList | File[]) => {
    if (!selectedIdRef.current) return;
    const arr = Array.from(list);
    const next: PendingChatImage[] = [];
    for (let i = 0; i < arr.length; i++) {
      const file = arr[i]!;
      if (!looksLikeImageFile(file)) continue;
      next.push({
        id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        url: URL.createObjectURL(file),
      });
    }
    if (next.length === 0) return;
    setPendingImages(p => [...p, ...next]);
  }, []);

  const handleImageFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const list = input.files;
      if (list?.length) appendImagesFromFileList(list);
      input.value = '';
    },
    [appendImagesFromFileList]
  );

  const handleComposerPaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData?.items;
      if (!items?.length || !selectedIdRef.current) return;
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it?.kind !== 'file') continue;
        const f = it.getAsFile();
        if (f && looksLikeImageFile(f)) files.push(f);
      }
      if (files.length === 0) return;
      e.preventDefault();
      appendImagesFromFileList(files);
    },
    [appendImagesFromFileList]
  );

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || sending) return;
    const text = draft.trim();
    const pending = pendingImages;
    if (!text && pending.length === 0) return;

    setSending(true);
    setMessagesError(null);
    try {
      if (pending.length > 0) {
        const chatId = selectedId;
        const captionForFirst = text;
        const snapshot = pending.map(p => ({
          pendingId: p.id,
          file: p.file,
          url: p.url,
        }));
        setPendingImages([]);
        setDraft('');

        const optimisticMsgs: WaMessage[] = snapshot.map((s, i) => ({
          idMessage: `${WA_OPTIMISTIC_MSG_PREFIX}${s.pendingId}`,
          timestamp: Math.floor(Date.now() / 1000) + i * 0.001,
          typeMessage: 'imageMessage',
          isFromMe: true,
          statusMessage: 'pending',
          caption: i === 0 && captionForFirst ? captionForFirst : undefined,
          localPreviewUrl: s.url,
        }));

        setMessages(prev => [...prev, ...optimisticMsgs]);

        const optIds = new Set(
          snapshot.map(s => `${WA_OPTIMISTIC_MSG_PREFIX}${s.pendingId}`)
        );
        const completed = new Set<number>();

        try {
          for (let i = 0; i < snapshot.length; i++) {
            const fd = new FormData();
            fd.append('chatId', chatId);
            fd.append('file', snapshot[i]!.file);
            if (i === 0 && captionForFirst)
              fd.append('caption', captionForFirst);
            const res = await fetch('/api/admin/whatsapp/messages/upload', {
              method: 'POST',
              credentials: 'include',
              body: fd,
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              throw new Error(
                typeof data.error === 'string'
                  ? data.error
                  : 'Не удалось отправить фото'
              );
            }
            const waId = data.idMessage;
            if (typeof waId !== 'string' || !waId) {
              throw new Error('Не получен id сообщения');
            }
            completed.add(i);
            outgoingLocalBlobByWaIdRef.current.set(waId, snapshot[i]!.url);
            const optId = `${WA_OPTIMISTIC_MSG_PREFIX}${snapshot[i]!.pendingId}`;
            setMessages(prev =>
              prev.map(m =>
                m.idMessage === optId
                  ? {
                      ...m,
                      idMessage: waId,
                      statusMessage: 'pending',
                      localPreviewUrl: snapshot[i]!.url,
                    }
                  : m
              )
            );
          }
          setSending(false);
          await loadMessages(chatId, { silent: true });
          await loadChats({ silent: true });
        } catch (uploadErr) {
          setMessages(prev => prev.filter(m => !optIds.has(m.idMessage)));
          snapshot.forEach((s, i) => {
            if (!completed.has(i)) {
              URL.revokeObjectURL(s.url);
            }
          });
          await loadMessages(chatId, { silent: true });
          throw uploadErr;
        }
      } else if (text) {
        const res = await fetch('/api/admin/whatsapp/messages', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId: selectedId, message: text }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Не удалось отправить');
        }
        setDraft('');
        await loadMessages(selectedId, { silent: true });
        await loadChats({ silent: true });
      }
    } catch (err) {
      setMessagesError(err instanceof Error ? err.message : 'Ошибка отправки');
    } finally {
      setSending(false);
    }
  }

  if (!showPanel) return null;

  return (
    <>
      <button
        type="button"
        className={clsx(
          'fixed inset-0 z-[145] cursor-default transition-[opacity,backdrop-filter] duration-300 ease-out motion-reduce:duration-150',
          enterReady
            ? 'bg-black/35 opacity-100 backdrop-blur-sm'
            : 'bg-black/0 opacity-0 backdrop-blur-none'
        )}
        aria-label="Закрыть"
        onClick={onClose}
      />

      <div
        className={clsx(
          'fixed z-[150] flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl will-change-transform',
          'dark:bg-gray-900',
          'origin-center md:origin-bottom-right',
          'transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-150 motion-reduce:ease-out',
          enterReady
            ? 'translate-y-0 scale-100 opacity-100 md:translate-x-0'
            : 'translate-y-3 scale-[0.97] opacity-0 md:translate-x-3 md:translate-y-4',
          /* Full viewport minus margin; width grows on large screens */
          'inset-4 h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] w-auto max-w-none',
          'sm:inset-6 sm:h-[calc(100dvh-3rem)] sm:max-h-[calc(100dvh-3rem)]',
          'md:bottom-6 md:left-auto md:right-6 md:top-6 md:h-[calc(100dvh-3rem)] md:max-h-[calc(100dvh-3rem)] md:w-[min(92vw,800px)] md:max-w-[800px]'
        )}
        role="dialog"
        aria-label="WhatsApp чаты"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-violet-900/20 bg-gradient-to-r from-[#075E54] to-[#0d6b5c] px-3 py-2.5 text-white">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">WhatsApp</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 text-white/90 transition-colors hover:bg-white/10"
            title="Закрыть"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col sm:flex-row">
          <aside
            className={clsx(
              'flex max-h-[min(44vh,340px)] min-h-[12rem] flex-col border-b border-violet-100',
              'sm:h-full sm:max-h-none sm:min-h-0 sm:w-[280px] sm:shrink-0 sm:border-b-0 sm:border-r sm:border-violet-100',
              'dark:border-violet-900/40'
            )}
          >
            <div className="shrink-0 px-3 pb-1 pt-3">
              <h2 className="text-[1.35rem] font-bold leading-tight tracking-tight text-gray-900 dark:text-gray-100">
                Чаты
              </h2>
            </div>
            <div className="flex shrink-0 items-stretch gap-1.5 px-2 pb-2 pt-1">
              <Input
                fullWidth
                placeholder="Поиск по чатам"
                value={chatFilter}
                onChange={e => setChatFilter(e.target.value)}
                className="min-w-0 flex-1 text-xs dark:border-gray-600 dark:bg-gray-800"
              />
              <button
                type="button"
                onClick={() => {
                  setAddContactErr(null);
                  setAddContactOpen(true);
                }}
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-violet-200 bg-white text-[#075E54] shadow-sm transition-colors hover:bg-violet-50 dark:border-violet-800 dark:bg-gray-800 dark:text-emerald-400 dark:hover:bg-gray-700"
                title="Новый контакт"
                aria-label="Добавить контакт"
              >
                <Plus className="h-5 w-5" strokeWidth={2.25} aria-hidden />
              </button>
            </div>
            <div
              ref={setChatListScrollEl}
              className="flex min-h-0 flex-1 flex-col overflow-y-auto px-1 pb-2"
            >
              {chatsLoading && <ChatListSkeleton />}
              {chatsError && (
                <p className="px-2 py-2 text-xs text-red-600">{chatsError}</p>
              )}
              {!chatsLoading && !chatsError && filteredChats.length === 0 && (
                <p className="px-2 py-3 text-center text-xs text-gray-500">
                  Нет чатов в базе. Откройте панель снова для синхронизации или
                  дождитесь входящих (webhook).
                </p>
              )}
              {!chatsLoading && !chatsError && filteredChats.length > 0 && (
                <div
                  className="relative w-full"
                  style={{ height: chatListVirtualizer.getTotalSize() }}
                >
                  {chatListVirtualizer.getVirtualItems().map(vRow => {
                    const c = filteredChats[vRow.index];
                    if (!c) return null;
                    const active = c.id === selectedId;
                    const totalUnread = c.unreadCount ?? 0;
                    const mediaUnread = c.unreadImageCount ?? 0;
                    const hasUnread = totalUnread > 0;
                    const badgeValue =
                      mediaUnread > 0 ? mediaUnread : totalUnread;
                    const badgeMediaStyle = mediaUnread > 0;
                    const sub =
                      c.lastPreview?.trim() ||
                      `${c.type === 'group' ? 'Группа' : 'Личный'} · ${c.id}`;
                    return (
                      <div
                        key={c.id}
                        data-index={vRow.index}
                        ref={chatListVirtualizer.measureElement}
                        className="absolute left-0 top-0 w-full px-0.5 pb-0.5"
                        style={{
                          transform: `translateY(${vRow.start}px)`,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedId(c.id)}
                          className={clsx(
                            'mb-0.5 flex w-full cursor-pointer items-start gap-2 rounded-lg border-0 px-2 py-2 text-left text-xs outline-none ring-0 transition-colors focus:outline-none focus:ring-0 focus-visible:outline-none',
                            active
                              ? 'bg-gradient-to-r from-violet-100 to-fuchsia-50 text-violet-950 dark:from-violet-900/50 dark:to-fuchsia-950/30 dark:text-violet-100'
                              : hasUnread
                                ? 'bg-violet-50/90 font-medium dark:bg-violet-950/40'
                                : 'hover:bg-violet-50 dark:hover:bg-gray-800'
                          )}
                        >
                          <ChatRowAvatar
                            chatId={c.id}
                            label={displayName(c)}
                            scrollRootEl={chatListScrollEl}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="line-clamp-2">
                              {displayName(c)}
                            </span>
                            <span className="mt-0.5 block truncate text-[10px] text-gray-500">
                              {sub}
                            </span>
                          </span>
                          {hasUnread && (
                            <span
                              className={clsx(
                                'mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white',
                                badgeMediaStyle
                                  ? 'bg-sky-500 shadow-sm dark:bg-sky-600'
                                  : 'bg-gradient-to-r from-violet-600 to-fuchsia-600'
                              )}
                              title={
                                badgeMediaStyle
                                  ? `Медиа непрочит.: ${mediaUnread} · всего сообщений: ${totalUnread}`
                                  : `Непрочитанных сообщений: ${totalUnread}`
                              }
                              aria-label={
                                badgeMediaStyle
                                  ? `Непрочитанные медиа: ${badgeValue}`
                                  : `Непрочитанные: ${badgeValue}`
                              }
                            >
                              {badgeValue > 99 ? '99+' : badgeValue}
                            </span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#ece5dd] dark:bg-gray-950">
            {selectedChat && (
              <header
                className="flex shrink-0 items-center gap-3 border-b border-gray-200/90 bg-[#f0f2f5] px-3 py-2.5 dark:border-gray-700 dark:bg-[#1f2c33]"
                aria-label="Активный чат"
              >
                <ChatRowAvatar
                  chatId={selectedChat.id}
                  label={displayName(selectedChat)}
                  eager
                  sizeClass="h-11 w-11 text-xs"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-semibold leading-tight text-gray-900 dark:text-gray-100">
                    {displayName(selectedChat)}
                  </p>
                  <p className="mt-0.5 truncate text-[13px] text-[#667781] dark:text-[#8696a0]">
                    {selectedChat.type === 'group'
                      ? 'Группа'
                      : 'Личные сообщения'}
                  </p>
                </div>
              </header>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-2 sm:px-3">
              {!selectedId && (
                <p className="py-8 text-center text-xs text-gray-500">
                  Выберите чат слева
                </p>
              )}
              {selectedId && messagesLoading && <MessagesSkeleton />}
              {selectedId && messagesError && (
                <p className="py-2 text-xs text-red-600">{messagesError}</p>
              )}
              {selectedId &&
                !messagesLoading &&
                (() => {
                  const frozen =
                    newMessagesDividerThresholdRef.current.get(selectedId);
                  const dividerReadThreshold =
                    frozen !== undefined ? frozen : readThroughTs;
                  const firstNewIncomingIdx = displayMessages.findIndex(
                    m => !m.isFromMe && m.timestamp > dividerReadThreshold
                  );
                  return displayMessages.map((m, idx) => {
                    const mine = Boolean(m.isFromMe);
                    const showNewDivider =
                      firstNewIncomingIdx >= 0 && idx === firstNewIncomingIdx;
                    const showDate = showDateSeparatorBefore(
                      displayMessages,
                      idx
                    );
                    const firstInGroup = isFirstInGroup(displayMessages, idx);
                    const lastInGroup = isLastInGroup(displayMessages, idx);
                    const rowReactions = reactionsByTarget.get(m.idMessage);
                    const bleedMedia = messageHasBleedMedia(m);
                    const dateLabel = formatDateBadge(m.timestamp);
                    const timeMetaEl = (
                      <>
                        <span>{formatTimeOnly(m.timestamp)}</span>
                        {mine && (
                          <OutgoingDeliveryTicks status={m.statusMessage} />
                        )}
                      </>
                    );

                    /** Как в WhatsApp: плотнее между пузырями; если есть реакция — больше места снизу (бейдж «свисает»). */
                    const hasReactions = Boolean(rowReactions?.length);
                    const bubbleRowMarginBottom = (() => {
                      if (
                        firstNewIncomingIdx > 0 &&
                        idx === firstNewIncomingIdx - 1
                      ) {
                        return 'mb-0';
                      }
                      if (hasReactions) {
                        return lastInGroup ? 'mb-6' : 'mb-5';
                      }
                      return lastInGroup ? 'mb-2' : 'mb-0.5';
                    })();

                    /** Визуал пузыря; лимит ширины — только на обёртке (см. ниже), чтобы не дублировать min() и не ломать flex. */
                    const bubbleBase = clsx(
                      'relative z-0 block min-w-0 overflow-visible px-2.5 pb-1.5 pt-2 text-[13px] leading-snug',
                      'transition-colors duration-300 ease-out',
                      'drop-shadow-[0_1px_0.5px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_1px_0.5px_rgba(0,0,0,0.35)]'
                    );

                    const bubbleCorners = firstInGroup
                      ? mine
                        ? 'rounded-[10px]'
                        : clsx(
                            'rounded-[10px] border border-gray-200/90 dark:border-gray-600'
                          )
                      : clsx(
                          'rounded-[9px]',
                          !mine &&
                            'border border-gray-200/90 dark:border-gray-600'
                        );

                    return (
                      <Fragment key={m.idMessage}>
                        {showDate && <DateBadge label={dateLabel} />}
                        {showNewDivider && <NewMessagesDivider />}
                        <div
                          className={clsx(
                            'flex w-full',
                            mine ? 'justify-end' : 'justify-start',
                            bubbleRowMarginBottom
                          )}
                        >
                          <div
                            className={clsx(
                              'relative w-fit min-w-0 max-w-[min(82%,36rem)] shrink-0',
                              mine && 'ml-auto',
                              hasReactions && 'pb-1'
                            )}
                          >
                            <div
                              ref={el => {
                                if (el) {
                                  messageBubbleRefs.current.set(
                                    m.idMessage,
                                    el
                                  );
                                } else {
                                  messageBubbleRefs.current.delete(m.idMessage);
                                }
                              }}
                              className={clsx(
                                bubbleBase,
                                bubbleCorners,
                                mine
                                  ? clsx(
                                      'text-gray-900 dark:text-gray-100',
                                      highlightedMessageId === m.idMessage
                                        ? 'dark:bg-emerald-950/88 bg-[#c4e2ad]'
                                        : 'bg-[#DCF8C6] dark:bg-emerald-900/55'
                                    )
                                  : clsx(
                                      'text-gray-900 dark:text-gray-100',
                                      highlightedMessageId === m.idMessage
                                        ? 'bg-[#e6e6e6] dark:bg-gray-700'
                                        : 'bg-white dark:bg-gray-800'
                                    )
                              )}
                            >
                              {bleedMedia ? (
                                <WaMessageBubbleContent
                                  m={m}
                                  bleedMedia
                                  firstInBubbleGroup={firstInGroup}
                                  footerMeta={timeMetaEl}
                                  onJumpToQuoted={jumpToQuotedMessage}
                                />
                              ) : (
                                <div className="flex min-w-0 items-end gap-2">
                                  <div className="min-w-0 flex-1">
                                    <WaMessageBubbleContent
                                      m={m}
                                      bleedMedia={false}
                                      firstInBubbleGroup={firstInGroup}
                                      onJumpToQuoted={jumpToQuotedMessage}
                                    />
                                  </div>
                                  <div
                                    className={clsx(
                                      'inline-flex shrink-0 translate-y-px items-center gap-0.5 text-[11px] tabular-nums leading-none text-[#667781] dark:text-[#94a9b3]'
                                    )}
                                  >
                                    {timeMetaEl}
                                  </div>
                                </div>
                              )}
                            </div>
                            {rowReactions && rowReactions.length > 0 ? (
                              <WaMessageReactionBadge
                                reactions={rowReactions}
                                mine={mine}
                              />
                            ) : null}
                          </div>
                        </div>
                      </Fragment>
                    );
                  });
                })()}
              <div ref={messagesEndRef} />
            </div>

            {selectedId ? (
              <form
                onSubmit={handleSend}
                onDragOver={e => {
                  if (e.dataTransfer?.types?.includes('Files')) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                  }
                }}
                onDrop={e => {
                  const dt = e.dataTransfer;
                  if (!dt?.files?.length || !selectedIdRef.current) return;
                  e.preventDefault();
                  appendImagesFromFileList(dt.files);
                }}
                className="shrink-0 border-t border-violet-100 bg-[#f0f2f5] p-2 dark:border-violet-900/40 dark:bg-[#1e2a30]"
              >
                <div className="flex items-end gap-1.5">
                  <div
                    className={clsx(
                      'flex min-w-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-gray-200/90 bg-white shadow-sm',
                      'dark:border-gray-600 dark:bg-gray-800',
                      pendingImages.length > 0
                        ? 'min-h-[5.25rem]'
                        : 'min-h-[34px]'
                    )}
                  >
                    {pendingImages.length > 0 ? (
                      <div className="flex max-h-[5rem] gap-1.5 overflow-x-auto border-b border-gray-100 px-2 py-1.5 dark:border-gray-700/80">
                        {pendingImages.map(p => (
                          <div
                            key={p.id}
                            className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-gray-200/90 bg-gray-50 dark:border-gray-600 dark:bg-gray-900/40"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element -- blob: превью перед отправкой */}
                            <img
                              src={p.url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              disabled={sending}
                              onClick={() => removePendingImage(p.id)}
                              className="absolute right-0.5 top-0.5 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/70 disabled:opacity-40"
                              title="Убрать"
                              aria-label="Убрать вложение"
                            >
                              <X
                                className="h-3 w-3"
                                strokeWidth={2.5}
                                aria-hidden
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="flex min-h-[34px] items-center gap-2 py-0.5 pl-2.5 pr-2">
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*,.heic,.heif"
                        multiple
                        className="sr-only"
                        tabIndex={-1}
                        onChange={handleImageFileChange}
                        aria-label="Выбор изображений для отправки"
                      />
                      <button
                        type="button"
                        disabled={sending}
                        onClick={() => imageInputRef.current?.click()}
                        className={clsx(
                          'mx-0.5 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors',
                          'bg-[#e9edef] text-[#54656f] hover:bg-[#d9dde0] dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
                          'disabled:cursor-not-allowed disabled:opacity-45'
                        )}
                        title="Прикрепить изображения"
                        aria-label="Прикрепить изображения"
                      >
                        <Plus
                          className="h-3.5 w-3.5"
                          strokeWidth={2.5}
                          aria-hidden
                        />
                      </button>
                      <textarea
                        ref={messageInputRef}
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        onPaste={handleComposerPaste}
                        onKeyDown={e => {
                          if (
                            e.key === 'Enter' &&
                            !e.shiftKey &&
                            !e.nativeEvent.isComposing
                          ) {
                            e.preventDefault();
                            e.currentTarget.form?.requestSubmit();
                          }
                        }}
                        placeholder="Введите сообщение"
                        disabled={sending}
                        rows={1}
                        className={clsx(
                          'box-border max-h-[160px] min-h-[32px] w-0 min-w-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent py-1.5 pr-1 text-sm leading-5 shadow-none outline-none ring-0',
                          'placeholder:text-[#8696a0] focus:ring-0 dark:placeholder:text-gray-500'
                        )}
                        aria-label="Текст сообщения"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={
                      (!draft.trim() && pendingImages.length === 0) || sending
                    }
                    className={clsx(
                      'flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-white shadow-sm transition',
                      'bg-[#00a884] hover:brightness-110 active:brightness-95',
                      'disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#00a884]'
                    )}
                    title="Отправить"
                    aria-label="Отправить"
                  >
                    {sending ? (
                      <Loader2
                        className="h-3.5 w-3.5 shrink-0 animate-spin"
                        aria-hidden
                      />
                    ) : (
                      <WaSendPlaneIcon className="h-3.5 w-3.5 shrink-0" />
                    )}
                  </button>
                </div>
              </form>
            ) : null}
          </section>
        </div>
      </div>

      <Modal
        isOpen={addContactOpen}
        onClose={() => {
          if (!addContactLoading) setAddContactOpen(false);
        }}
        title="Новый контакт"
        size="sm"
        zIndex="z-[160]"
        className="max-w-[min(100vw-2rem,400px)]"
        allowContentOverflow
      >
        <form className="space-y-3 px-6 py-4" onSubmit={submitAddContact}>
          <div className="space-y-1">
            <label
              htmlFor="wa-add-first"
              className="text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              Имя
            </label>
            <Input
              id="wa-add-first"
              fullWidth
              required
              autoComplete="given-name"
              value={addFirstName}
              onChange={e => setAddFirstName(e.target.value)}
              placeholder="Имя"
              className="text-sm dark:border-gray-600 dark:bg-gray-800"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="wa-add-last"
              className="text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              Фамилия{' '}
              <span className="font-normal text-gray-400">(необязательно)</span>
            </label>
            <Input
              id="wa-add-last"
              fullWidth
              autoComplete="family-name"
              value={addLastName}
              onChange={e => setAddLastName(e.target.value)}
              placeholder="Фамилия"
              className="text-sm dark:border-gray-600 dark:bg-gray-800"
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Телефон
            </span>
            <PhoneInput
              value={addPhone}
              onChange={setAddPhone}
              disabled={addContactLoading}
              placeholder="+7 000 000-00-00"
              dropdownZClass="z-[170]"
              overlayZClass="z-[165]"
              className="text-sm"
            />
          </div>
          {addContactErr ? (
            <p className="text-xs text-red-600 dark:text-red-400">
              {addContactErr}
            </p>
          ) : null}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={addContactLoading}
              onClick={() => setAddContactOpen(false)}
            >
              Отмена
            </Button>
            <Button type="submit" size="sm" disabled={addContactLoading}>
              {addContactLoading ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Сохранение…
                </span>
              ) : (
                'Сохранить'
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

/** Filled paper plane pointing right (WhatsApp-style); uses `currentColor` from the parent button. */
function WaSendPlaneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.99.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" />
    </svg>
  );
}

function ChatListSkeleton() {
  return (
    <div
      className="flex min-h-full flex-1 flex-col gap-2 px-2 py-1"
      aria-hidden
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="shrink-0 animate-pulse rounded-lg border border-violet-100/60 bg-gradient-to-r from-violet-50/90 to-fuchsia-50/50 p-2 dark:border-violet-900/30 dark:from-violet-950/40 dark:to-fuchsia-950/20"
        >
          <div className="h-3 w-[75%] rounded bg-violet-200/80 dark:bg-violet-800/50" />
          <div className="mt-2 h-2 w-1/2 rounded bg-violet-100/80 dark:bg-violet-900/40" />
        </div>
      ))}
      <div
        className="min-h-[3rem] flex-1 animate-pulse rounded-lg border border-violet-100/50 bg-gradient-to-b from-violet-50/80 via-violet-100/40 to-fuchsia-50/30 dark:border-violet-900/25 dark:from-violet-950/35 dark:via-violet-950/20 dark:to-fuchsia-950/15"
        aria-hidden
      />
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div className="space-y-2 py-2" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={clsx(
            'flex w-full',
            i % 2 === 0 ? 'justify-start' : 'justify-end'
          )}
        >
          <div
            className={clsx(
              'max-w-[min(75%,18.5rem)] animate-pulse rounded-[7px] border border-gray-200/60 bg-white/90 p-2.5 dark:border-gray-700 dark:bg-gray-800/60',
              i % 2 === 1 &&
                'border-emerald-200/40 bg-[#DCF8C6]/90 dark:border-emerald-900/40 dark:bg-emerald-900/35'
            )}
          >
            <div className="h-3 w-[12rem] max-w-full rounded bg-gray-200/90 dark:bg-gray-700/50" />
            <div className="mt-2 h-3 w-4/5 rounded bg-gray-100 dark:bg-gray-700/40" />
            <div className="ml-auto mt-2 h-2 w-10 rounded bg-gray-200/80 dark:bg-gray-600/50" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
