import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { getSmsProvider, normalizePhoneToE164 } from '@/lib/server/sms';

const cookieName = 'mo_otp';
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'dev-secret-change-me'
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawPhone = (body?.phone as string) || '';
    const phone = normalizePhoneToE164(rawPhone);
    if (!phone.startsWith('+7') || phone.length < 12)
      return NextResponse.json(
        { error: 'Некорректный телефон' },
        { status: 400 }
      );

    const code = String(Math.floor(100000 + Math.random() * 900000));

    const token = await new SignJWT({ phone, code })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('10m')
      .sign(secret);

    (await cookies()).set(cookieName, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 600,
    });

    const sms = getSmsProvider();
    await sms.send(phone, `Код входа: ${code}`);

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
