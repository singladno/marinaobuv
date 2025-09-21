import type { Role } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/server/db';
import {
  processDraftImagesForApprovalById,
  updateDraftImagesWithS3Urls,
} from '@/lib/draft-approval-image-processor';

export async function POST(req: NextRequest) {
  try {
    requireRole(req, ['ADMIN' as Role]);
    const body = await req.json();
    const { ids, categoryId } = body as { ids: string[]; categoryId?: string };
    if (!Array.isArray(ids) || !ids.length) {
      return NextResponse.json({ error: 'ids are required' }, { status: 400 });
    }

    // If no categoryId provided, use the first root category
    let finalCategoryId = categoryId;
    if (!finalCategoryId) {
      const firstRootCategory = await prisma.category.findFirst({
        where: { parentId: null, isActive: true },
        orderBy: { sort: 'asc' },
        select: { id: true },
      });

      if (!firstRootCategory) {
        return NextResponse.json(
          { error: 'No root category found' },
          { status: 400 }
        );
      }

      finalCategoryId = firstRootCategory.id;
    }

    const drafts = await prisma.waDraftProduct.findMany({
      where: { id: { in: ids } },
      include: { images: true },
    });

    const results: { draftId: string; productId?: string; error?: string }[] =
      [];

    for (const d of drafts) {
      try {
        // Process and upload images to S3 before approval
        console.log(`Processing images for draft ${d.id}...`);
        const processedImages = await processDraftImagesForApprovalById(d.id);

        // Update draft images with S3 URLs
        if (processedImages.length > 0) {
          await updateDraftImagesWithS3Urls(processedImages);
          console.log(
            `Updated ${processedImages.length} images with S3 URLs for draft ${d.id}`
          );
        }

        // Update the draft status to 'approved' after S3 upload
        await prisma.waDraftProduct.update({
          where: { id: d.id },
          data: {
            status: 'approved',
            categoryId: finalCategoryId, // Set the category for the draft
          },
        });

        results.push({ draftId: d.id });
      } catch (err: unknown) {
        console.error(`Error processing draft ${d.id}:`, err);
        results.push({
          draftId: d.id,
          error: err instanceof Error ? err.message : 'Failed to approve',
        });
      }
    }

    return NextResponse.json({ results });
  } catch (e: unknown) {
    const status = (e as any)?.status ?? 500;
    return NextResponse.json(
      { error: (e as any)?.message ?? 'Unexpected error' },
      { status }
    );
  }
}
