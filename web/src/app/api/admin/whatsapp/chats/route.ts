import { NextRequest, NextResponse } from 'next/server';

import { tryCreateGreenApiAdminFetcher } from '@/lib/green-api-fetcher';
import { requireAuth } from '@/lib/server/auth-helpers';
import { logServerError } from '@/lib/server/logger';

/** Journal lookback for last activity per chat (Green API caps lists at 10k messages). */
const JOURNAL_MINUTES = 43_200; // 30 days

type ChatRow = {
  id: string;
  name: string;
  contactName?: string;
  type: 'user' | 'group';
};

function labelForSort(c: ChatRow): string {
  const n = (c.name || '').trim();
  const cn = (c.contactName || '').trim();
  if (n) return n;
  if (cn) return cn;
  return c.id;
}

function mergeActivityByChat(
  incoming: Array<{ chatId?: string; timestamp?: number }>,
  outgoing: Array<{ chatId?: string; timestamp?: number }>
): Map<string, number> {
  const m = new Map<string, number>();
  const bump = (chatId?: string, ts?: number) => {
    if (!chatId || ts == null || !Number.isFinite(ts)) return;
    const prev = m.get(chatId);
    if (prev === undefined || ts > prev) m.set(chatId, ts);
  };
  for (const row of incoming) bump(row.chatId, row.timestamp);
  for (const row of outgoing) bump(row.chatId, row.timestamp);
  return m;
}

/** Latest message time first; chats with no journal hits sort by name (A→Я). */
function sortChatsByLatestActivity(
  chats: ChatRow[],
  activity: Map<string, number>
): ChatRow[] {
  return [...chats].sort((a, b) => {
    const ta = activity.get(a.id) ?? 0;
    const tb = activity.get(b.id) ?? 0;
    if (tb !== ta) return tb - ta;
    return labelForSort(a).localeCompare(labelForSort(b), 'ru', {
      sensitivity: 'base',
    });
  });
}

export async function GET(_request: NextRequest) {
  const auth = await requireAuth(_request, 'ADMIN');
  if (auth.error) return auth.error;

  const api = tryCreateGreenApiAdminFetcher();
  if (!api) {
    return NextResponse.json(
      { error: 'Green API не настроен на сервере' },
      { status: 503 }
    );
  }

  try {
    const chats = await api.getContacts();

    const [incRes, outRes] = await Promise.allSettled([
      api.getLastIncomingMessages(JOURNAL_MINUTES),
      api.getLastOutgoingMessages(JOURNAL_MINUTES),
    ]);

    const incoming = incRes.status === 'fulfilled' ? incRes.value : [];
    const outgoing = outRes.status === 'fulfilled' ? outRes.value : [];

    if (incRes.status === 'rejected') {
      logServerError(
        '[admin/whatsapp/chats] lastIncomingMessages failed (ordering may be partial):',
        incRes.reason
      );
    }
    if (outRes.status === 'rejected') {
      logServerError(
        '[admin/whatsapp/chats] lastOutgoingMessages failed (ordering may be partial):',
        outRes.reason
      );
    }

    const activity = mergeActivityByChat(incoming, outgoing);
    const sorted = sortChatsByLatestActivity(chats, activity);

    return NextResponse.json({ chats: sorted });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Ошибка Green API при загрузке чатов';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
