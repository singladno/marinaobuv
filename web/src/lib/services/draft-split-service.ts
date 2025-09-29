import { prisma } from '@/lib/server/db';

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
      name: originalDraft.name,
      article: originalDraft.article,
      pricePair: originalDraft.pricePair,
      categoryId: originalDraft.categoryId,
      source: originalDraft.source,
      sizes: originalDraft.sizes,
      gender: originalDraft.gender,
      season: originalDraft.season,
      provider: originalDraft.provider,
      gptRequest: originalDraft.gptRequest,
      gptResponse: originalDraft.gptResponse,
      aiStatus: originalDraft.aiStatus,
      aiStatusMessage: originalDraft.aiStatusMessage,
      isActive: originalDraft.isActive,
      images: {
        create: originalDraft.images
          .filter(img => imageIds.includes(img.id))
          .map(img => ({
            url: img.url,
            isActive: img.isActive,
            waMessageId: img.waMessageId,
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
      images: newDraft.images,
    },
  };
}
