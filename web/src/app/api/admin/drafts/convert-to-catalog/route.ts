import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';

import { convertDraftToProduct } from './conversion-service';

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
    }

    // Get drafts with their images (allow any status)
    const drafts = await prisma.waDraftProduct.findMany({
      where: {
        id: { in: ids },
        // status filter removed: we allow converting any status
      },
      include: { images: true },
    });

    if (drafts.length === 0) {
      return NextResponse.json({ error: 'No drafts found' }, { status: 404 });
    }

    const results: { draftId: string; productId?: string; error?: string }[] =
      [];

    for (const draft of drafts) {
      try {
        const normalizedDraft: any = {
          ...draft,
          pricePair:
            (draft as any).pricePair &&
            typeof (draft as any).pricePair === 'object'
              ? Number((draft as any).pricePair)
              : ((draft as any).pricePair ?? 0),
        };
        const product = await convertDraftToProduct(normalizedDraft);
        results.push({ draftId: draft.id, productId: product.id });
      } catch (err: unknown) {
        console.error(`  ❌ Failed to convert draft ${draft.id}:`, err);
        results.push({
          draftId: draft.id,
          error:
            err instanceof Error ? err.message : 'Failed to convert to catalog',
        });
      }
    }

    const successCount = results.filter(r => !r.error).length;

    return NextResponse.json({
      success: true,
      message: `Successfully converted ${successCount} of ${drafts.length} drafts to catalog products`,
      results,
      summary: {
        total: drafts.length,
        successful: successCount,
        failed: drafts.length - successCount,
      },
    });
  } catch (error) {
    console.error('Error in convert-to-catalog:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
