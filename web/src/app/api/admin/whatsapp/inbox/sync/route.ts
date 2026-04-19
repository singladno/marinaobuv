import { NextRequest, NextResponse } from 'next/server';

import { tryCreateGreenApiAdminFetcher } from '@/lib/green-api-fetcher';
import { requireAuth } from '@/lib/server/auth-helpers';
import { upsertWaAdminChatsFromContacts } from '@/lib/wa-admin-inbox';

/**
 * Sync contact list from Green API into WaAdminChat (names for search / sidebar).
 * Message history is webhook-only — we do not pull journals or getChatHistory here.
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

  try {
    const contacts = await api.getContacts();
    await upsertWaAdminChatsFromContacts(contacts);

    return NextResponse.json({
      ok: true,
      contacts: contacts.length,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Ошибка синхронизации Green API';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
