import type { Role } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/server/db';
import {
  processDraftImagesForApprovalById,
  updateDraftImagesWithS3Urls,
} from '@/lib/draft-approval-image-processor';
import { broadcastApprovalEvent } from '@/app/api/approval-events/route';

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
        console.log(`\n🚀 Starting approval process for draft: ${d.id}`);
        console.log(`   Name: ${d.name || 'No name'}`);
        console.log(`   Current status: ${d.status}`);
        console.log(`   Images count: ${d.images.length}`);

        // Log current image URLs
        console.log(`   Current image URLs:`);
        d.images.forEach((img, index) => {
          console.log(
            `     ${index + 1}. ${img.url} (Active: ${img.isActive})`
          );
        });

        // Wait a moment for SSE connections to be established
        await new Promise(resolve => setTimeout(resolve, 100));

        // Emit approval start event
        broadcastApprovalEvent(d.id, {
          type: 'approval_start',
          draftId: d.id,
          totalImages: d.images.filter(img => img.isActive).length,
          timestamp: Date.now(),
        });

        // Process and upload images to S3 before approval
        console.log(`\n📸 Processing images for draft ${d.id}...`);
        const processedImages = await processDraftImagesForApprovalById(d.id);

        // Update draft images with S3 URLs
        if (processedImages.length > 0) {
          console.log(
            `\n🔄 Updating ${processedImages.length} images with S3 URLs...`
          );
          await updateDraftImagesWithS3Urls(processedImages);
          console.log(
            `✅ Successfully updated ${processedImages.length} images with S3 URLs for draft ${d.id}`
          );

          // Log new S3 URLs
          console.log(`   New S3 URLs:`);
          processedImages.forEach((img, index) => {
            console.log(`     ${index + 1}. ${img.url}`);
          });
        } else {
          console.log(`⚠️  No images were processed for draft ${d.id}`);
        }

        // Update the draft status to 'approved' after S3 upload
        console.log(`\n✅ Updating draft status to 'approved'...`);
        await prisma.waDraftProduct.update({
          where: { id: d.id },
          data: {
            status: 'approved',
            categoryId: finalCategoryId, // Set the category for the draft
          },
        });

        console.log(`🎉 Draft ${d.id} successfully approved!`);

        // Emit approval complete event
        broadcastApprovalEvent(d.id, {
          type: 'approval_complete',
          draftId: d.id,
          success: true,
          totalProcessed: processedImages.length,
          totalFailed: 0,
          newS3Urls: processedImages.map(img => img.url),
          timestamp: Date.now(),
        });

        results.push({ draftId: d.id });
      } catch (err: unknown) {
        console.error(`❌ Error processing draft ${d.id}:`, err);

        // Emit approval complete event - failed
        broadcastApprovalEvent(d.id, {
          type: 'approval_complete',
          draftId: d.id,
          success: false,
          totalProcessed: 0,
          totalFailed: 1,
          newS3Urls: [],
          timestamp: Date.now(),
        });

        results.push({
          draftId: d.id,
          error: err instanceof Error ? err.message : 'Failed to approve',
        });
      }
    }

    console.log(`\n🎉 Approval process completed!`);
    console.log(`   Total drafts processed: ${drafts.length}`);
    console.log(
      `   Successful approvals: ${results.filter(r => !r.error).length}`
    );
    console.log(`   Failed approvals: ${results.filter(r => r.error).length}`);

    if (results.some(r => r.error)) {
      console.log(`\n❌ Errors encountered:`);
      results
        .filter(r => r.error)
        .forEach(r => {
          console.log(`   Draft ${r.draftId}: ${r.error}`);
        });
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
