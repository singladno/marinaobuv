import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
    }

    // Update the status of approved drafts to 'processed' (moved to catalog)
    const updated = await prisma.waDraftProduct.updateMany({
      where: {
        id: { in: ids },
        status: 'approved', // Only convert approved drafts
      },
      data: {
        status: 'processed',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Converted ${updated.count} drafts to catalog`,
      count: updated.count,
    });
  } catch (e: any) {
    console.error('Error converting drafts to catalog:', e);
    return NextResponse.json(
      { error: 'Failed to convert drafts to catalog' },
      { status: 500 }
    );
  }
}
