import type { Role } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/server/db';
import { logRequestError } from '@/lib/server/request-logging';

export async function POST(req: NextRequest) {
  try {
    requireRole(req, ['ADMIN' as Role]);
    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
    }

    // Permanently delete selected drafts and their images
    const deleted = await prisma.waDraftProduct.deleteMany({
      where: {
        id: { in: ids },
        isDeleted: true, // Only permanently delete already soft-deleted drafts
      },
    });

    return NextResponse.json({
      success: true,
      message: `Permanently deleted ${deleted.count} drafts`,
      count: deleted.count,
    });
  } catch (error) {
    logRequestError(req, '/api/admin/drafts/bulk-permanent-delete', error, 'Error permanently deleting drafts:');
    return NextResponse.json(
      { error: 'Failed to permanently delete drafts' },
      { status: 500 }
    );
  }
}
