'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import clsx from 'clsx';
import { Check } from 'lucide-react';
import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Input } from '@/components/ui/Input';
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

function ChatRowAvatar({
  chatId,
  label,
  /** Элемент со скроллом списка чатов: фото не грузим, пока строка не в viewport. */
  scrollRootEl,
}: {
  chatId: string;
  label: string;
  scrollRootEl?: HTMLDivElement | null;
}) {
  const [broken, setBroken] = useState(false);
  const [photoReady, setPhotoReady] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | undefined>(undefined);
  const blobUrlRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initials = chatInitials(label);

  /** Пока нет root — не грузим фото; после ref на скролл — только если строка в видимой области. */
  const [inListViewport, setInListViewport] = useState(false);

  useEffect(() => {
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
  }, [scrollRootEl, chatId]);

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
      className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 text-[11px] font-bold text-white shadow-sm"
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

function messageBody(m: WaMessage): string {
  if (m.textMessage) return m.textMessage;
  if (m.caption) return m.caption;
  if (m.typeMessage && m.typeMessage !== 'textMessage') {
    return `(${m.typeMessage})`;
  }
  return '—';
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
/** Разделитель как в Telegram: полоска с текстом над первым новым входящим. */
function NewMessagesDivider() {
  return (
    <div
      className="-mx-2 mb-2 w-[calc(100%+1rem)] sm:mx-0 sm:w-full"
      role="separator"
      aria-label="Новые сообщения"
    >
      <div className="bg-sky-100/90 py-2 text-center text-[11px] font-medium text-gray-700 dark:bg-sky-950/50 dark:text-gray-200">
        Новые сообщения
      </div>
    </div>
  );
}

/** WhatsApp-style centered day pill */
function DateBadge({ label }: { label: string }) {
  return (
    <div className="my-3 flex w-full justify-center px-2">
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
        <Check className={clsx(tickClass, '-mr-[7px]')} aria-hidden />
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
  const [chatsLoading, setChatsLoading] = useState(false);
  const [chatsError, setChatsError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WaMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [readThroughTs, setReadThroughTs] = useState(0);

  /** Скролл-контейнер списка чатов: виртуализация + lazy-аватары по viewport. */
  const [chatListScrollEl, setChatListScrollEl] =
    useState<HTMLDivElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;

  const chatsRequestBusy = useRef(false);
  const messagesRequestBusy = useRef(false);
  const mergeAttemptedRef = useRef(new Set<string>());
  const didColdSyncRef = useRef(false);

  /** In-memory last loaded thread per chat (instant switch back without network). */
  const threadMemoryRef = useRef(
    new Map<string, { messages: WaMessage[]; readThroughTs: number }>()
  );
  const messagesRef = useRef<WaMessage[]>([]);
  const readThroughTsRef = useRef(0);
  messagesRef.current = messages;
  readThroughTsRef.current = readThroughTs;

  const loadChats = useCallback(
    async (opts?: { silent?: boolean }): Promise<number> => {
      const silent = Boolean(opts?.silent);
      if (silent && chatsRequestBusy.current) return -1;
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
    async (chatId: string, opts?: { silent?: boolean }) => {
      const silent = Boolean(opts?.silent);
      if (silent && messagesRequestBusy.current) return;
      messagesRequestBusy.current = true;
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
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Не удалось загрузить сообщения');
        }
        let msgs: WaMessage[] = Array.isArray(data.messages)
          ? data.messages
          : [];
        let meta: { readThroughTs?: number } = data;
        /**
         * One merge per chat per panel lifetime: pull getChatHistory into DB so the thread
         * is not "webhooks only" with gaps when journal/sync had partial rows first.
         * (Previously we only merged when the first DB read returned 0 rows — that skipped
         * backfill whenever any messages already existed.)
         */
        if (
          selectedIdRef.current === chatId &&
          !mergeAttemptedRef.current.has(chatId)
        ) {
          mergeAttemptedRef.current.add(chatId);
          const mres = await fetch('/api/admin/whatsapp/inbox/merge', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatId, count: 100 }),
          });
          if (mres.ok) {
            const res2 = await fetch(
              `/api/admin/whatsapp/inbox/messages?${params}`,
              { credentials: 'include' }
            );
            const data2 = await res2.json().catch(() => ({}));
            if (res2.ok && selectedIdRef.current === chatId) {
              msgs = Array.isArray(data2.messages) ? data2.messages : [];
              meta = data2;
            }
          }
        }
        if (selectedIdRef.current === chatId) {
          const rts =
            typeof meta.readThroughTs === 'number' ? meta.readThroughTs : 0;
          setMessages(msgs);
          setReadThroughTs(rts);
          threadMemoryRef.current.set(chatId, {
            messages: msgs,
            readThroughTs: rts,
          });
          void waInboxIdbPutThread(chatId, {
            messages: msgs,
            readThroughTs: rts,
          });
        }
      } catch (e) {
        if (!silent) {
          setMessagesError(e instanceof Error ? e.message : 'Ошибка загрузки');
          setMessages([]);
        }
      } finally {
        messagesRequestBusy.current = false;
        if (!silent) {
          setMessagesLoading(false);
        }
      }
    },
    []
  );

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

      await fetch('/api/admin/whatsapp/inbox/read', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: id }),
      });
      if (cancelled || selectedIdRef.current !== id) return;
      await loadChats({ silent: true });
      if (cancelled || selectedIdRef.current !== id) return;

      await loadMessages(id, { silent: networkSilent });
    })();

    return () => {
      cancelled = true;
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

  const filteredChats = useMemo(() => {
    const q = chatFilter.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(c => {
      const label = displayName(c).toLowerCase();
      return label.includes(q) || c.id.toLowerCase().includes(q);
    });
  }, [chats, chatFilter]);

  const chatListVirtualizer = useVirtualizer({
    count: filteredChats.length,
    getScrollElement: () => chatListScrollEl,
    estimateSize: () => 68,
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

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !draft.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/admin/whatsapp/messages', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: selectedId, message: draft.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Не удалось отправить');
      }
      setDraft('');
      await loadMessages(selectedId);
    } catch (err) {
      setMessagesError(err instanceof Error ? err.message : 'Ошибка отправки');
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[145] cursor-default bg-black/30 backdrop-blur-sm"
        aria-label="Закрыть"
        onClick={onClose}
      />

      <div
        className={clsx(
          'fixed z-[150] flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl',
          'dark:bg-gray-900',
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
            <p className="truncate text-xs text-white/80">
              {selectedChat ? displayName(selectedChat) : 'Выберите чат'}
            </p>
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
            <div className="shrink-0 p-2">
              <Input
                fullWidth
                placeholder="Поиск по чатам"
                value={chatFilter}
                onChange={e => setChatFilter(e.target.value)}
                className="text-xs dark:border-gray-600 dark:bg-gray-800"
              />
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
                          minHeight: vRow.size,
                          transform: `translateY(${vRow.start}px)`,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedId(c.id)}
                          className={clsx(
                            'mb-0.5 flex w-full cursor-pointer items-start gap-2 rounded-lg px-2 py-2 text-left text-xs transition-colors',
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
                  const firstNewIncomingIdx = messages.findIndex(
                    m => !m.isFromMe && m.timestamp > readThroughTs
                  );
                  return messages.map((m, idx) => {
                    const mine = Boolean(m.isFromMe);
                    const showNewDivider =
                      firstNewIncomingIdx >= 0 && idx === firstNewIncomingIdx;
                    const showDate = showDateSeparatorBefore(messages, idx);
                    const firstInGroup = isFirstInGroup(messages, idx);
                    const lastInGroup = isLastInGroup(messages, idx);
                    const dateLabel = formatDateBadge(m.timestamp);

                    /** WhatsApp-style “comic” tail: curved tab at top outer corner (first bubble in a group only). */
                    const bubbleBase = clsx(
                      'relative z-0 w-fit max-w-[min(75%,18.5rem)] min-w-[3rem] overflow-visible px-2.5 pb-1.5 pt-2 text-[13px] leading-snug',
                      /* Unified soft shadow on bubble + tail (pseudo counts for drop-shadow in WebKit/Chromium). */
                      'drop-shadow-[0_1px_0.5px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_1px_0.5px_rgba(0,0,0,0.35)]'
                    );

                    const bubbleCorners = firstInGroup
                      ? mine
                        ? clsx(
                            'rounded-[9px] rounded-tr-[3px]',
                            /* inherit = same computed bg as bubble (light/dark) — no seam at the curve */
                            'after:pointer-events-none after:absolute after:-right-2 after:top-0 after:z-0 after:block after:h-[19px] after:w-[13px] after:rounded-bl-[18px] after:bg-inherit after:content-[""]'
                          )
                        : clsx(
                            'rounded-[9px] rounded-tl-[3px] border border-gray-200/90',
                            'before:pointer-events-none before:absolute before:-left-2 before:top-0 before:z-0 before:block before:h-[19px] before:w-[13px] before:rounded-br-[18px] before:bg-inherit before:content-[""]',
                            'dark:border-gray-600'
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
                            lastInGroup ? 'mb-2' : 'mb-0.5'
                          )}
                        >
                          <div
                            className={clsx(
                              bubbleBase,
                              bubbleCorners,
                              mine
                                ? 'bg-[#DCF8C6] text-gray-900 dark:bg-emerald-900/55 dark:text-gray-100'
                                : 'bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                            )}
                          >
                            {!mine && m.senderName && (
                              <p className="mb-0.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                                {m.senderName}
                              </p>
                            )}
                            <div className="flex items-end gap-2">
                              <p className="min-w-0 flex-1 whitespace-pre-wrap break-words">
                                {messageBody(m)}
                              </p>
                              <div
                                className={clsx(
                                  'inline-flex shrink-0 items-center gap-0.5 pb-0.5 text-[11px] tabular-nums text-[#667781] dark:text-[#94a9b3]'
                                )}
                              >
                                <span>{formatTimeOnly(m.timestamp)}</span>
                                {mine && (
                                  <OutgoingDeliveryTicks
                                    status={m.statusMessage}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Fragment>
                    );
                  });
                })()}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSend}
              className="shrink-0 border-t border-violet-100 bg-white p-2 dark:border-violet-900/40 dark:bg-gray-900"
            >
              <div className="flex gap-2">
                <textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  placeholder={
                    selectedId ? 'Сообщение…' : 'Сначала выберите чат'
                  }
                  disabled={!selectedId || sending}
                  rows={2}
                  className={clsx(
                    'min-h-[44px] flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-none outline-none',
                    'placeholder:text-muted focus:border-violet-500 focus:ring-2 focus:ring-violet-200',
                    'dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-violet-900/40'
                  )}
                />
                <button
                  type="submit"
                  disabled={!selectedId || !draft.trim() || sending}
                  className="shrink-0 cursor-pointer self-end rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {sending ? '…' : 'Отправить'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </>
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
