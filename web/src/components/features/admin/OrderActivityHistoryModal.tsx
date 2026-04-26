'use client';

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Loader2 } from 'lucide-react';

import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { getOrderActivitySeenAt } from '@/lib/order-activity-read-storage';

export type OrderActivityEntry = {
  id: string;
  at: string;
  title: string;
  subtitle?: string | null;
  actorLabel: string;
  actorKind: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  /** Called after a successful load with the latest event time (or now if the list is empty). Marks the timeline as “seen” for unread badge. */
  onHistorySeen?: (maxEventAtIso: string) => void;
};

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function actorBadgeClass(kind: string): string {
  switch (kind) {
    case 'AI':
      return 'border border-violet-200/80 bg-violet-50 text-violet-800 dark:border-violet-800/60 dark:bg-violet-950/50 dark:text-violet-200';
    case 'SYSTEM':
      return 'border border-slate-200/90 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200';
    case 'ADMIN':
      return 'border border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-200';
    case 'CLIENT':
      return 'border border-sky-200/80 bg-sky-50 text-sky-800 dark:border-sky-800/50 dark:bg-sky-950/40 dark:text-sky-200';
    case 'GRUZCHIK':
      return 'border border-amber-200/80 bg-amber-50 text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-100';
    case 'USER':
      return 'border border-cyan-200/80 bg-cyan-50 text-cyan-900 dark:border-cyan-800/50 dark:bg-cyan-950/40 dark:text-cyan-200';
    default:
      return 'border border-gray-200/90 bg-gray-50 text-gray-800 dark:border-gray-600 dark:bg-gray-800/80 dark:text-gray-200';
  }
}

/** Card surface + left accent by initiator; improves scanability. */
function activityItemShellClass(kind: string): string {
  const shell =
    'rounded-2xl border border-l-4 p-4 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.05]';
  switch (kind) {
    case 'AI':
      return cn(
        shell,
        'border-violet-200/90 bg-violet-50/70 border-l-violet-500 dark:border-violet-800/60 dark:bg-violet-950/30'
      );
    case 'SYSTEM':
      return cn(
        shell,
        'border-slate-200/90 bg-slate-50/80 border-l-slate-500 dark:border-slate-600/80 dark:bg-slate-900/40'
      );
    case 'ADMIN':
      return cn(
        shell,
        'border-emerald-200/80 bg-emerald-50/70 border-l-emerald-500 dark:border-emerald-800/50 dark:bg-emerald-950/30'
      );
    case 'CLIENT':
      return cn(
        shell,
        'border-sky-200/85 bg-sky-50/70 border-l-sky-500 dark:border-sky-800/50 dark:bg-sky-950/30'
      );
    case 'GRUZCHIK':
      return cn(
        shell,
        'border-amber-200/90 bg-amber-50/80 border-l-amber-500 dark:border-amber-800/50 dark:bg-amber-950/30'
      );
    case 'USER':
      return cn(
        shell,
        'border-cyan-200/85 bg-cyan-50/70 border-l-cyan-500 dark:border-cyan-800/50 dark:bg-cyan-950/30'
      );
    default:
      return cn(
        shell,
        'border-gray-200/90 bg-gradient-to-b from-white to-gray-50/80 border-l-gray-400 dark:border-gray-700/90 dark:from-gray-900 dark:to-gray-900/60'
      );
  }
}

/** Как в чате WhatsApp: линия над первыми «новыми» записями. */
function NewActivityDivider() {
  return (
    <div
      className="-mx-1 w-[calc(100%+0.5rem)] sm:-mx-0 sm:w-full"
      role="separator"
      aria-label="Новые записи"
    >
      <div className="border-y border-amber-200/90 bg-amber-50/95 py-1.5 text-center text-[12px] font-semibold text-amber-900 shadow-sm dark:border-amber-800/40 dark:bg-amber-950/50 dark:text-amber-100">
        Новые
      </div>
    </div>
  );
}

function firstUnreadIndex(
  list: { at: string }[],
  seenAtWhenOpened: string | null | undefined
): number {
  if (list.length === 0 || seenAtWhenOpened === undefined) return -1;
  if (seenAtWhenOpened == null) return 0;
  const t = new Date(seenAtWhenOpened).getTime();
  if (Number.isNaN(t)) return 0;
  for (let i = 0; i < list.length; i += 1) {
    if (new Date(list[i]!.at).getTime() > t) {
      return i;
    }
  }
  return -1;
}

export function OrderActivityHistoryModal({
  isOpen,
  onClose,
  orderId,
  onHistorySeen,
}: Props) {
  const [events, setEvents] = useState<OrderActivityEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadSucceeded, setLoadSucceeded] = useState(false);
  /** Значение «прочитано до» в момент открытия (до закрытия не меняем — чтобы подсветка стабильна). */
  const [seenAtWhenOpened, setSeenAtWhenOpened] = useState<
    string | null | undefined
  >(undefined);

  const newBlockScrollRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLoadSucceeded(false);
    setSeenAtWhenOpened(undefined);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/activity`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? 'Ошибка загрузки');
      }
      const data = await res.json();
      const list: OrderActivityEntry[] = Array.isArray(data.events)
        ? data.events
        : [];
      setEvents(list);
      setSeenAtWhenOpened(getOrderActivitySeenAt(orderId));
      setLoadSucceeded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (isOpen) {
      void load();
    }
  }, [isOpen, load]);

  const firstNewIdx = useMemo(
    () => firstUnreadIndex(events, seenAtWhenOpened),
    [events, seenAtWhenOpened]
  );

  const hasNewRows = firstNewIdx >= 0;

  useEffect(() => {
    if (!isOpen || loading || !hasNewRows) return;
    const id = window.setTimeout(() => {
      newBlockScrollRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 80);
    return () => window.clearTimeout(id);
  }, [isOpen, loading, hasNewRows, firstNewIdx, events.length]);

  const handleClose = useCallback(() => {
    if (loadSucceeded && onHistorySeen) {
      if (events.length === 0) {
        onHistorySeen(new Date().toISOString());
      } else {
        const maxAt = events.reduce((a, b) => (a.at > b.at ? a : b)).at;
        onHistorySeen(maxAt);
      }
    }
    onClose();
  }, [loadSucceeded, onHistorySeen, onClose, events]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="История действий по заказу"
      size="lg"
    >
      <div className="max-h-[min(70vh,560px)] overflow-y-auto scroll-smooth px-6 py-5">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500 dark:text-gray-400">
            <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
            <span>Загрузка…</span>
          </div>
        )}
        {!loading && error && (
          <p className="py-8 text-center text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {!loading && !error && events.length === 0 && (
          <p className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            Нет записей
          </p>
        )}
        {!loading && !error && events.length > 0 && (
          <ol className="flex list-none flex-col gap-3">
            {events.map((ev, index) => {
              return (
                <Fragment key={ev.id}>
                  {index === firstNewIdx && hasNewRows && (
                    <li className="list-none">
                      <div ref={newBlockScrollRef}>
                        <NewActivityDivider />
                      </div>
                    </li>
                  )}
                  <li className={activityItemShellClass(ev.actorKind)}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-gray-900 dark:text-gray-50">
                          {ev.title}
                        </h3>
                        {ev.subtitle ? (
                          <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                            {ev.subtitle}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 sm:pl-2 sm:pt-0.5">
                        <time
                          className="inline-flex w-fit rounded-lg bg-gray-100/90 px-2.5 py-1.5 text-[11px] font-medium tabular-nums leading-none text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                          dateTime={ev.at}
                        >
                          {formatWhen(ev.at)}
                        </time>
                      </div>
                    </div>
                    <div
                      className={cn(
                        'mt-3.5 border-t pt-3.5',
                        'border-gray-200/80 dark:border-gray-600/50'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-flex rounded-lg px-2.5 py-1 text-xs font-medium',
                          actorBadgeClass(ev.actorKind)
                        )}
                      >
                        {ev.actorLabel}
                      </span>
                    </div>
                  </li>
                </Fragment>
              );
            })}
          </ol>
        )}
      </div>
    </Modal>
  );
}
