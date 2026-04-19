import { NextRequest, NextResponse } from 'next/server';

import { tryCreateGreenApiFetcher } from '@/lib/green-api-fetcher';
import { requireAuth } from '@/lib/server/auth-helpers';
import {
  upsertWaAdminChatsFromContacts,
  upsertWaAdminFromJournalRows,
} from '@/lib/wa-admin-inbox';

const JOURNAL_MINUTES = 43_200; // 30 days

/**
 * One-shot sync from Green API into WaAdmin* tables (contacts + journals).
 * Does not call getChatHistory per chat (rate limits); use merge endpoint for a full thread.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, 'ADMIN');
  if (auth.error) return auth.error;

  const api = tryCreateGreenApiFetcher();
  if (!api) {
    return NextResponse.json(
      { error: 'Green API не настроен на сервере' },
      { status: 503 }
    );
  }

  try {
    const contacts = await api.getContacts();
    await upsertWaAdminChatsFromContacts(contacts);

    const [incRes, outRes] = await Promise.allSettled([
      api.getLastIncomingMessages(JOURNAL_MINUTES),
      api.getLastOutgoingMessages(JOURNAL_MINUTES),
    ]);

    const incoming = incRes.status === 'fulfilled' ? incRes.value : [];
    const outgoing = outRes.status === 'fulfilled' ? outRes.value : [];

    await upsertWaAdminFromJournalRows(incoming, outgoing);

    return NextResponse.json({
      ok: true,
      contacts: contacts.length,
      journalIncoming: incoming.length,
      journalOutgoing: outgoing.length,
      journalErrors: {
        incoming: incRes.status === 'rejected' ? String(incRes.reason) : null,
        outgoing: outRes.status === 'rejected' ? String(outRes.reason) : null,
      },
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Ошибка синхронизации Green API';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
