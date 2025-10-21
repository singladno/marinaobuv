import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { env } from '@/lib/env';
import { prisma } from '@/lib/server/db';
import { createSession } from '@/lib/server/session';

const cookieName = 'mo_otp';
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'dev-secret-change-me'
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = (body?.code as string) || '';
    if (!/^[0-9]{4,6}$/.test(code))
      return NextResponse.json({ error: 'Некорректный код' }, { status: 400 });

    const token = (await cookies()).get(cookieName)?.value;
    if (!token)
      return NextResponse.json({ error: 'Код не запрошен' }, { status: 400 });

    let payload: { code: string; phone: string };
    try {
      const verified = await jwtVerify(token, secret);
      payload = verified.payload as { code: string; phone: string };
    } catch {
      return NextResponse.json({ error: 'Код истёк' }, { status: 400 });
    }

    if (payload.code !== code) {
      return NextResponse.json({ error: 'Неверный код' }, { status: 400 });
    }

    const phone = payload.phone as string;
    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      // Check if there's a provider with this phone number
      const provider = await prisma.provider.findFirst({
        where: { phone },
      });

      let role: 'ADMIN' | 'PROVIDER' | 'CLIENT' = 'CLIENT';
      let providerId = null;

      // If admin phone, set as ADMIN
      if (env.ADMIN_PHONE && env.ADMIN_PHONE === phone) {
        role = 'ADMIN';
      }
      // If provider exists with this phone, connect user to provider
      else if (provider) {
        role = 'PROVIDER';
        providerId = provider.id;
      }

      user = await prisma.user.create({
        data: {
          phone,
          role,
          passwordHash: 'otp-login',
          providerId,
        },
      });
    }
    // If existing user matches admin phone, ensure role is ADMIN
    if (env.ADMIN_PHONE && env.ADMIN_PHONE === phone && user.role !== 'ADMIN') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' },
      });
    }
    // If existing user doesn't have a provider but there's a provider with this phone, connect them
    else if (!user.providerId) {
      const provider = await prisma.provider.findFirst({
        where: { phone },
      });
      if (provider && user.role !== 'ADMIN') {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            role: 'PROVIDER',
            providerId: provider.id,
          },
        });
      }
    }

    await createSession({
      userId: user.id,
      role: user.role,
      providerId: user.providerId,
    });
    (await cookies()).delete(cookieName);

    return NextResponse.json({
      ok: true,
      user: { id: user.id, phone: user.phone, role: user.role },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
