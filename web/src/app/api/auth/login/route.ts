import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { verifyPassword } from '@/lib/server/password';
import { createSession } from '@/lib/server/session';
import { normalizePhoneToE164 } from '@/lib/server/sms';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, password } = body as { phone: string; password: string };
    if (!phone || !password)
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    // Normalize phone number to handle different formats
    const normalizedPhone = normalizePhoneToE164(phone);
    
    const user = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    await createSession({
      userId: user.id,
      role: user.role,
      providerId: user.providerId,
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
