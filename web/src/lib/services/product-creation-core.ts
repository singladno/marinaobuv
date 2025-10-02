import type { AnalysisResult } from '@/lib/services/unified-analysis-service';

import { prisma } from '../db-node';
import { getOrCreateProvider } from '../provider-utils';

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

    // Get or create provider
    const providerId = await getOrCreateProvider(from, fromName);
    if (!providerId) {
      throw new Error(
        `Failed to get or create provider for ${fromName} (${from})`
      );
    }

    // Create the draft product
    const draftProduct = await prisma.waDraftProduct.create({
      data: {
        messageId,
        providerId, // Use the actual provider ID from the database
        name: analysis.name || 'Untitled Product',
        article: articleNumber,
        description: analysis.description || '',
        material: analysis.material || '',
        gender: mapGender(analysis.gender || 'UNISEX'),
        season: mapSeason(analysis.season || 'AUTUMN'),
        pricePair: analysis.price || 0,
        providerDiscount: analysis.providerDiscount || 0,
        sizes: analysis.sizes || [],
        source: sourceMessageIds,
        gptRequest: '',
        rawGptResponse: undefined,
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

  /**
   * Create a final product directly from analysis results
   */
  async createFinalProductFromAnalysis({
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

    // Get or create provider
    const providerId = await getOrCreateProvider(from, fromName);
    if (!providerId) {
      throw new Error(
        `Failed to get or create provider for ${fromName} (${from})`
      );
    }

    // Get or create category based on LLM analysis
    let category;
    if (analysis.categoryId) {
      // Use existing category
      category = await prisma.category.findUnique({
        where: { id: analysis.categoryId },
      });
    }

    if (!category && analysis.newCategory) {
      // Create new category as suggested by LLM
      category = await prisma.category.create({
        data: {
          name: analysis.newCategory.name,
          slug: analysis.newCategory.slug,
          path: `/category/${analysis.newCategory.slug}`,
          parentId: analysis.newCategory.parentCategoryId,
          sort: 100,
          isActive: true,
        },
      });
    }

    if (!category) {
      // Fallback: find or create a default "Обувь" category
      category = await prisma.category.findFirst({
        where: { name: 'Обувь' },
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: 'Обувь',
            slug: 'obuv',
            path: '/obuv',
            sort: 100,
            isActive: true,
          },
        });
      }
    }

    // Create the final product directly
    const product = await prisma.product.create({
      data: {
        name: analysis.name || 'Untitled Product',
        slug,
        article: articleNumber,
        categoryId: category.id,
        description: analysis.description || '',
        material: analysis.material || '',
        gender: mapGender(analysis.gender || 'UNISEX'),
        season: mapSeason(analysis.season || 'AUTUMN'),
        pricePair: analysis.price || 0,
        currency: 'RUB',
        isActive: true, // Set as active immediately
        images: {
          create: images.map((image, index) => ({
            url: image.url,
            key: image.key || '',
            alt: `Product image ${index + 1}`,
            sort: index,
            isPrimary: index === 0,
            color: null, // Color not available in ImageData
            width: image.width || null,
            height: image.height || null,
          })),
        },
        sizes: {
          create: (analysis.sizes || []).map((size, index) => ({
            size: size.size,
            stock: 0, // Default stock value
            sku: `${articleNumber}-${size.size}`,
            sort: index,
          })),
        },
      },
    });

    return product;
  }
}
