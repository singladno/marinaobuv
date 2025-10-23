import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { prisma } from '@/lib/server/db';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !('id' in session.user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get full user data from database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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
