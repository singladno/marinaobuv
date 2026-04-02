import { NextRequest, NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/server/db';
import { logRequestError } from '@/lib/server/request-logging';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, ['ADMIN']);

    const { id } = await params;

    // Find user with this providerId
    const user = await prisma.user.findFirst({
      where: {
        providerId: id,
        role: 'PROVIDER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    logRequestError(request, '/api/admin/providers/[id]/user', error, 'Error fetching user for provider:');
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
