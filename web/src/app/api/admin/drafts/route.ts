import type { Role } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth';

import { getDraftById, getDrafts } from './draft-service';

export async function GET(req: NextRequest) {
  try {
    requireRole(req, ['ADMIN' as Role]);
    const { searchParams } = new URL(req.url);
    const take = Math.min(parseInt(searchParams.get('take') || '50', 10), 100);
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const status = searchParams.get('status') || undefined;

    const { drafts, total } = await getDrafts({ take, skip, status });

    return NextResponse.json({
      drafts,
      pagination: {
        total,
        take,
        skip,
        hasMore: skip + take < total,
      },
    });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drafts' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    requireRole(req, ['ADMIN' as Role]);
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Draft ID is required' },
        { status: 400 }
      );
    }

    const draft = await getDraftById(id);

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    return NextResponse.json({ draft });
  } catch (error) {
    console.error('Error fetching draft:', error);
    return NextResponse.json(
      { error: 'Failed to fetch draft' },
      { status: 500 }
    );
  }
}
