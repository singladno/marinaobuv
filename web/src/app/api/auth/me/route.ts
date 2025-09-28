import { NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { getSession } from '@/lib/server/session';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });

  // Get full user data from database
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      phone: true,
      name: true,
      role: true,
      providerId: true,
    },
  });

  if (!user) return NextResponse.json({ user: null });

  return NextResponse.json({
    user: {
      userId: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      providerId: user.providerId,
    },
  });
}
