import { NextRequest, NextResponse } from 'next/server';

import { env } from '@/lib/env';
import { prisma } from '@/lib/server/db';
import { verifyPassword } from '@/lib/server/password';
import { createSession } from '@/lib/server/session';
import { normalizePhoneToE164 } from '@/lib/server/sms';
import { extractNormalizedPhone } from '@/lib/utils/whatsapp-phone-extractor';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, password } = body as { phone: string; password: string };
    if (!phone || !password)
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    // Normalize phone number to handle different formats
    const normalizedPhone = normalizePhoneToE164(phone);

    // Find user by phone
    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    // User must exist and have a valid password
    if (
      !user ||
      !user.passwordHash ||
      !verifyPassword(password, user.passwordHash)
    ) {
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
      // First try exact match with normalized phone
      let provider = await prisma.provider.findFirst({
        where: { phone: normalizedPhone },
      });

      // If no exact match, try to find provider by WhatsApp ID format
      if (!provider) {
        const allProviders = await prisma.provider.findMany({
          where: { phone: { not: null } },
        });

        provider =
          allProviders.find(p => {
            if (!p.phone) return false;
            const extractedPhone = extractNormalizedPhone(p.phone);
            return extractedPhone === normalizedPhone;
          }) || null;
      }

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
