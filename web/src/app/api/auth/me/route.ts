import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';
import { logger } from '@/lib/server/logger';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) {
    return auth.error;
  }

  logger.debug({ userId: auth.user.id }, 'auth/me lookup');

  // Get full user data from database
  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      role: true,
      providerId: true,
    },
  });

  if (user) {
    logger.debug(
      { userId: user.id, role: user.role },
      'auth/me user loaded'
    );
  }

  if (!user) {
    logger.debug({ userId: auth.user.id }, 'auth/me user not in database');
    return NextResponse.json(
      { error: 'Пользователь не найден' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: user.role,
      providerId: user.providerId,
    },
  });
}
