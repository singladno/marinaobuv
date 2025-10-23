import { NextResponse } from 'next/server';

import { clearSession } from '@/lib/server/session';

export async function POST() {
  try {
    console.log('🔍 LOGOUT API DEBUG: Starting logout API call');
    console.log('🔍 LOGOUT API DEBUG: NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
    console.log(
      '🔍 LOGOUT API DEBUG: NEXT_PUBLIC_SITE_URL:',
      process.env.NEXT_PUBLIC_SITE_URL
    );

    await clearSession();
    console.log('🔍 LOGOUT API DEBUG: Session cleared successfully');

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    console.error('🔍 LOGOUT API DEBUG: Error during logout:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
