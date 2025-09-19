import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { getSession } from '@/lib/server/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { draftId, imageIds } = await request.json();

    if (
      !draftId ||
      !imageIds ||
      !Array.isArray(imageIds) ||
      imageIds.length === 0
    ) {
      return NextResponse.json(
        { error: 'Draft ID and image IDs are required' },
        { status: 400 }
      );
    }

    // Get the original draft with all related data
    const originalDraft = await prisma.waDraftProduct.findUnique({
      where: { id: draftId },
      include: {
        images: true,
        category: true,
      },
    });

    if (!originalDraft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Verify that all image IDs exist in the draft
    const existingImageIds = originalDraft.images.map(img => img.id);
    const invalidImageIds = imageIds.filter(
      id => !existingImageIds.includes(id)
    );

    if (invalidImageIds.length > 0) {
      return NextResponse.json(
        { error: 'Some image IDs are invalid' },
        { status: 400 }
      );
    }

    // Start a transaction
    const result = await prisma.$transaction(async tx => {
      // Create a new WhatsApp message for the split product
      const newMessage = await tx.whatsAppMessage.create({
        data: {
          waMessageId: `split_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          from: 'system',
          fromName: 'System Split',
          type: 'text',
          text: `Split from draft: ${originalDraft.name}`,
          timestamp: Math.floor(Date.now() / 1000),
          createdAt: new Date(),
          providerId: originalDraft.providerId,
          rawPayload: { split: true, originalDraftId: draftId },
        },
      });

      // Create the new draft with the same data
      const newDraft = await tx.waDraftProduct.create({
        data: {
          messageId: newMessage.id,
          providerId: originalDraft.providerId,
          name: originalDraft.name,
          pricePair: originalDraft.pricePair,
          currency: originalDraft.currency,
          packPairs: originalDraft.packPairs,
          priceBox: originalDraft.priceBox,
          material: originalDraft.material,
          gender: originalDraft.gender,
          season: originalDraft.season,
          description: originalDraft.description,
          sizes: originalDraft.sizes as any,
          providerDiscount: originalDraft.providerDiscount,
          rawGptResponse: originalDraft.rawGptResponse as any,
          gptRequest: originalDraft.gptRequest,
          rawGptResponse2: originalDraft.rawGptResponse2 as any,
          gptRequest2: originalDraft.gptRequest2,
          source: originalDraft.source as any,
          color: originalDraft.color,
          categoryId: originalDraft.categoryId,
          status: originalDraft.status,
          isDeleted: originalDraft.isDeleted,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Categories and sizes are already copied as JSON fields in the new draft

      // Move selected images to the new draft
      const selectedImages = originalDraft.images.filter(img =>
        imageIds.includes(img.id)
      );
      const remainingImages = originalDraft.images.filter(
        img => !imageIds.includes(img.id)
      );

      // Update selected images to belong to the new draft
      if (selectedImages.length > 0) {
        await tx.waDraftProductImage.updateMany({
          where: {
            id: { in: imageIds },
          },
          data: {
            draftProductId: newDraft.id,
          },
        });
      }

      // If no images remain in the original draft, mark it as deleted
      if (remainingImages.length === 0) {
        await tx.waDraftProduct.update({
          where: { id: draftId },
          data: { isDeleted: true },
        });
      }

      return {
        originalDraftId: draftId,
        newDraftId: newDraft.id,
        movedImageCount: selectedImages.length,
        remainingImageCount: remainingImages.length,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error splitting draft:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: 'Failed to split draft',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
