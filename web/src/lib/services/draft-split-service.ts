import { prisma } from '@/lib/db-node';

interface SplitDraftParams {
  draftId: string;
  imageIds: string[];
}

export async function splitDraft({ draftId, imageIds }: SplitDraftParams) {
  // Get the original draft with all related data
  const originalDraft = await prisma.waDraftProduct.findUnique({
    where: { id: draftId },
    include: {
      images: true,
      category: true,
    },
  });

  if (!originalDraft) {
    throw new Error('Draft not found');
  }

  // Verify that all image IDs exist in the draft
  const existingImageIds = originalDraft.images.map(img => img.id);
  const invalidImageIds = imageIds.filter(id => !existingImageIds.includes(id));

  if (invalidImageIds.length > 0) {
    throw new Error('Some image IDs are invalid');
  }

  // Create the new draft with selected images
  const newDraft = await prisma.waDraftProduct.create({
    data: {
      messageId: originalDraft.messageId,
      providerId: originalDraft.providerId,
      name: originalDraft.name,
      article: originalDraft.article,
      pricePair: originalDraft.pricePair,
      categoryId: originalDraft.categoryId,
      source: originalDraft.source as any,
      sizes: originalDraft.sizes as any,
      gender: originalDraft.gender,
      season: originalDraft.season,
      gptRequest: originalDraft.gptRequest,
      rawGptResponse: originalDraft.rawGptResponse as any,
      aiStatus: originalDraft.aiStatus,
      aiContext: originalDraft.aiContext,
      images: {
        create: originalDraft.images
          .filter(img => imageIds.includes(img.id))
          .map(img => ({
            key: img.key,
            url: img.url,
            mimeType: img.mimeType,
            width: img.width,
            height: img.height,
            color: img.color,
          })),
      },
    },
    include: {
      images: true,
      category: true,
    },
  });

  // Update the original draft to remove the selected images
  await prisma.waDraftProduct.update({
    where: { id: draftId },
    data: {
      images: {
        deleteMany: {
          id: {
            in: imageIds,
          },
        },
      },
    },
  });

  return {
    originalDraft: {
      id: originalDraft.id,
      name: originalDraft.name,
      remainingImages: originalDraft.images.filter(
        img => !imageIds.includes(img.id)
      ).length,
    },
    newDraft: {
      id: newDraft.id,
      name: newDraft.name,
      images: (newDraft as any).images || [],
    },
  };
}
