import { NextResponse } from 'next/server';

import { clearSession } from '@/lib/server/session';

export async function POST() {
  try {
    await clearSession();
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
