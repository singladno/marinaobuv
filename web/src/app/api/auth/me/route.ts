import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) {
    return auth.error;
  }

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

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
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
