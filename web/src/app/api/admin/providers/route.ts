import { NextRequest, NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/server/db';

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ['ADMIN']);

    const providers = await prisma.provider.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        place: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(providers);
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}
