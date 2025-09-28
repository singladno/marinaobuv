import type { AnalysisResult } from '@/lib/services/unified-analysis-service';

import { prisma } from '../db-node';

import { ImageData } from './image-processing-service';
import {
  generateArticleNumber,
  createSlug,
  mapSeason,
  mapGender,
} from './product-creation-mappers';

interface CreateDraftProductFromAnalysisParams {
  messageId: string;
  from: string;
  fromName: string;
  analysis: AnalysisResult;
  images: ImageData[];
  context: string;
  sourceMessageIds?: string[];
}

/**
 * Core service for creating draft products from analysis results
 */
export class ProductCreationCore {
  /**
   * Create a draft product from analysis results
   */
  async createDraftProductFromAnalysis({
    messageId,
    from,
    fromName,
    analysis,
    images,
    context,
    sourceMessageIds = [],
  }: CreateDraftProductFromAnalysisParams) {
    const articleNumber = generateArticleNumber();
    const slug = createSlug(analysis.name || 'Untitled Product');

    // Create the draft product
    const draftProduct = await prisma.waDraftProduct.create({
      data: {
        name: analysis.name || 'Untitled Product',
        article: articleNumber,
        slug,
        description: analysis.description || '',
        material: analysis.material || '',
        gender: mapGender(analysis.gender || 'UNISEX'),
        season: mapSeason(analysis.season || 'AUTUMN'),
        pricePair: analysis.price || 0,
        providerDiscount: analysis.providerDiscount || 0,
        sizes: analysis.sizes || [],
        source: 'whatsapp',
        context,
        messageId,
        from,
        fromName,
        sourceMessageIds,
        gptRequest: '',
        rawGptResponse: '',
        aiStatus: 'ai_completed',
        aiProcessedAt: new Date(),
      },
    });

    // Create draft images
    if (images.length > 0) {
      await prisma.waDraftProductImage.createMany({
        data: images.map((image, index) => ({
          draftProductId: draftProduct.id,
          url: image.url,
          isActive: true,
          sort: index,
          isPrimary: index === 0,
        })),
      });
    }

    return draftProduct;
  }

  /**
   * Update an existing draft product with new analysis results
   */
  async updateDraftProductFromAnalysis(
    draftProductId: string,
    analysis: AnalysisResult,
    images: ImageData[]
  ) {
    // Update the draft product
    const updatedDraft = await prisma.waDraftProduct.update({
      where: { id: draftProductId },
      data: {
        name: analysis.name || undefined,
        description: analysis.description || undefined,
        material: analysis.material || undefined,
        gender: analysis.gender ? mapGender(analysis.gender) : undefined,
        season: analysis.season ? mapSeason(analysis.season) : undefined,
        pricePair: analysis.price || undefined,
        providerDiscount: analysis.providerDiscount || undefined,
        sizes: analysis.sizes || undefined,
        gptRequest: undefined,
        rawGptResponse: undefined,
        aiStatus: 'ai_completed',
        aiProcessedAt: new Date(),
      },
    });

    // Update images if provided
    if (images.length > 0) {
      // Delete existing images
      await prisma.waDraftProductImage.deleteMany({
        where: { draftProductId },
      });

      // Create new images
      await prisma.waDraftProductImage.createMany({
        data: images.map((image, index) => ({
          draftProductId,
          url: image.url,
          isActive: true,
          sort: index,
          isPrimary: index === 0,
        })),
      });
    }

    return updatedDraft;
  }
}
