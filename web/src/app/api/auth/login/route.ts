import { NextRequest, NextResponse } from 'next/server';

import { env } from '@/lib/env';
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

    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user matches admin phone and update role if needed
    let updatedUser = user;
    if (
      env.ADMIN_PHONE &&
      env.ADMIN_PHONE === normalizedPhone &&
      user.role !== 'ADMIN'
    ) {
      updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' },
      });
    }

    await createSession({
      userId: updatedUser.id,
      role: updatedUser.role,
      providerId: updatedUser.providerId,
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: updatedUser.id,
        phone: updatedUser.phone,
        name: updatedUser.name,
        role: updatedUser.role,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
