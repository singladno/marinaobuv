import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
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

    const token = cookies().get(cookieName)?.value;
    if (!token)
      return NextResponse.json({ error: 'Код не запрошен' }, { status: 400 });

    let payload: any;
    try {
      const verified = await jwtVerify(token, secret);
      payload = verified.payload as any;
    } catch {
      return NextResponse.json({ error: 'Код истёк' }, { status: 400 });
    }

    if (payload.code !== code) {
      return NextResponse.json({ error: 'Неверный код' }, { status: 400 });
    }

    const phone = payload.phone as string;
    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({
        data: { phone, role: 'CLIENT', passwordHash: 'otp-login' as any },
      });
    }

    await createSession({
      userId: user.id,
      role: user.role,
      providerId: user.providerId,
    });
    cookies().delete(cookieName);

    return NextResponse.json({
      ok: true,
      user: { id: user.id, phone: user.phone, role: user.role },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
