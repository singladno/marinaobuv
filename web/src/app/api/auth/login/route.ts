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

    let user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    // If user doesn't exist, check if there's a provider with this phone
    if (!user) {
      const provider = await prisma.provider.findFirst({
        where: { phone: normalizedPhone },
      });

      if (provider) {
        // Create user and connect to provider
        user = await prisma.user.create({
          data: {
            phone: normalizedPhone,
            role: 'PROVIDER',
            passwordHash: 'otp-login', // Default password for provider login
            providerId: provider.id,
          },
        });
      } else {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }
    } else if (!verifyPassword(password, user.passwordHash)) {
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
    // If existing user doesn't have a provider but there's a provider with this phone, connect them
    else if (!user.providerId) {
      const provider = await prisma.provider.findFirst({
        where: { phone: normalizedPhone },
      });
      if (provider && user.role !== 'ADMIN') {
        updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            role: 'PROVIDER',
            providerId: provider.id,
          },
        });
      }
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
