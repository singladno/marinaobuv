import type { Role } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/server/db';

export async function POST(req: NextRequest) {
  try {
    requireRole(req, ['ADMIN' as Role]);
    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
    }

    // Mark selected drafts as deleted
    const updated = await prisma.waDraftProduct.updateMany({
      where: {
        id: { in: ids },
        isDeleted: false, // Only delete non-deleted drafts
      },
      data: {
        isDeleted: true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${updated.count} drafts`,
      count: updated.count,
    });
  } catch (error) {
    console.error('Error bulk deleting drafts:', error);
    return NextResponse.json(
      { error: 'Failed to delete drafts' },
      { status: 500 }
    );
  }
}
