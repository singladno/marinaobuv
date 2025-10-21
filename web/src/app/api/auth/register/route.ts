import type { Prisma, Role } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { hashPassword } from '@/lib/server/password';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, name, password, role } = body as {
      phone: string;
      name?: string;
      password: string;
      role?: Role;
    };

    if (!phone || !password) {
      return NextResponse.json(
        { error: 'phone and password are required' },
        { status: 400 }
      );
    }

    const exists = await prisma.user.findUnique({ where: { phone } });
    if (exists)
      return NextResponse.json({ error: 'User exists' }, { status: 400 });

    // Note: passwordHash is added by pending migration; cast to satisfy current client types.
    const data = {
      phone,
      name: name ?? null,
      role: (role ?? 'CLIENT') as Role,
      passwordHash: hashPassword(password),
    } as unknown as Prisma.UserUncheckedCreateInput;

    const user = await prisma.user.create({
      data,
      select: { id: true, phone: true, name: true, role: true },
    });

    return NextResponse.json({ user });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
