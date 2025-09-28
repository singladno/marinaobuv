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

    // Restore selected drafts (set isDeleted to false)
    const updated = await prisma.waDraftProduct.updateMany({
      where: {
        id: { in: ids },
        isDeleted: true, // Only restore deleted drafts
      },
      data: {
        isDeleted: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Restored ${updated.count} drafts`,
      count: updated.count,
    });
  } catch (error) {
    console.error('Error bulk restoring drafts:', error);
    return NextResponse.json(
      { error: 'Failed to restore drafts' },
      { status: 500 }
    );
  }
}
