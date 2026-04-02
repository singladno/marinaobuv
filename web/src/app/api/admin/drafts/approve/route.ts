import type { Role } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth';
// TODO: Re-implement image processing for draft approval
// import {
//   processDraftImagesForApprovalById,
//   updateDraftImagesWithS3Urls,
// } from '@/lib/draft-approval-image-processor';
import { prisma } from '@/lib/server/db';
import { logRequestError } from '@/lib/server/request-logging';
import { logger } from '@/lib/server/logger';

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
        logger.debug(`\n🚀 Starting approval process for draft: ${d.id}`);
        logger.debug(`   Name: ${d.name || 'No name'}`);
        logger.debug(`   Current status: ${d.status}`);
        logger.debug(`   Images count: ${d.images.length}`);

        // Log current image URLs
        logger.debug(`   Current image URLs:`);
        d.images.forEach((img, index) => {
          logger.debug(
            `     ${index + 1}. ${img.url} (Active: ${img.isActive})`
          );
        });

        // TODO: Re-implement image processing for draft approval
        // Process and upload images to S3 before approval
        // logger.debug(`\n📸 Processing images for draft ${d.id}...`);
        // const processedImages = await processDraftImagesForApprovalById(d.id);

        // // Update draft images with S3 URLs
        // if (processedImages.length > 0) {
        //   logger.debug(
        //     `\n🔄 Updating ${processedImages.length} images with S3 URLs...`
        //   );
        //   await updateDraftImagesWithS3Urls(processedImages);
        //   logger.debug(
        //     `✅ Successfully updated ${processedImages.length} images with S3 URLs for draft ${d.id}`
        //   );

        //   // Log new S3 URLs
        //   logger.debug(`   New S3 URLs:`);
        //   processedImages.forEach((img, index) => {
        //     logger.debug(`     ${index + 1}. ${img.url}`);
        //   });
        // } else {
        //   logger.debug(`⚠️  No images were processed for draft ${d.id}`);
        // }

        // Update the draft status to 'approved' after S3 upload
        logger.debug(`\n✅ Updating draft status to 'approved'...`);
        await prisma.waDraftProduct.update({
          where: { id: d.id },
          data: {
            status: 'approved',
            categoryId: finalCategoryId, // Set the category for the draft
          },
        });

        logger.debug(`🎉 Draft ${d.id} successfully approved!`);

        results.push({ draftId: d.id });
      } catch (err: unknown) {
        logRequestError(req, '/api/admin/drafts/approve', err, `❌ Error processing draft ${d.id}:`);

        results.push({
          draftId: d.id,
          error: err instanceof Error ? err.message : 'Failed to approve',
        });
      }
    }

    logger.debug(`\n🎉 Approval process completed!`);
    logger.debug(`   Total drafts processed: ${drafts.length}`);
    logger.debug(
      `   Successful approvals: ${results.filter(r => !r.error).length}`
    );
    logger.debug(`   Failed approvals: ${results.filter(r => r.error).length}`);

    if (results.some(r => r.error)) {
      logger.debug(`\n❌ Errors encountered:`);
      results
        .filter(r => r.error)
        .forEach(r => {
          logger.debug(`   Draft ${r.draftId}: ${r.error}`);
        });
    }

    return NextResponse.json({ results });
  } catch (e: unknown) {
    const error = e as Error & { status?: number };
    const status = error?.status ?? 500;
    return NextResponse.json(
      { error: error?.message ?? 'Unexpected error' },
      { status }
    );
  }
}
