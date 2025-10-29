import type { AnalysisResult } from '@/lib/types/analysis-result';

import { prisma } from '../db-node';
import {
  getOrCreateProvider,
  extractProviderFromSenderName,
} from '../provider-utils';

import { ImageData } from './image-processing-service';
import {
  generateArticleNumber,
  createSlug,
  mapSeason,
  mapGender,
  inferGenderFromSizes,
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
    // Try to extract name from fromName first, then from rawPayload if available
    let extractedName: string | null = null;
    let extractedPlace: string | null = null;

    if (fromName) {
      const result = extractProviderFromSenderName(fromName);
      extractedName = result.name;
      extractedPlace = result.place;
    }

    const providerId = await getOrCreateProvider(
      from,
      extractedName,
      extractedPlace || analysis.providerPlace || null
    );
    if (!providerId) {
      throw new Error(
        `Failed to get or create provider for ${extractedName || fromName} (${from})`
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
        // Determine gender conservatively: use AI value if present, else infer from sizes
        gender: analysis.gender
          ? mapGender(analysis.gender)
          : inferGenderFromSizes(analysis.sizes as any) || undefined,
        season: mapSeason(analysis.season || 'AUTUMN'),
        pricePair: analysis.price || 0,
        providerDiscount: analysis.providerDiscount || 0,
        sizes: (analysis.sizes || []).map(size => ({
          size: size.size,
          count: size.count || 1,
        })),
        source: sourceMessageIds,
        gptRequest: '',
        rawGptResponse: undefined,
        rawGptResponse2: analysis as any,
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
          key: image.key || null,
          isActive: true,
          sort: index,
          isPrimary: index === 0,
          color: image.color || null,
          width: image.width || null,
          height: image.height || null,
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
        sizes: analysis.sizes
          ? analysis.sizes.map(size => ({
              size: size.size,
              count: size.count || 1,
            }))
          : undefined,
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
          key: image.key || null,
          isActive: true,
          sort: index,
          isPrimary: index === 0,
          color: image.color || null,
          width: image.width || null,
          height: image.height || null,
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
    // Try to extract name from fromName first, then from rawPayload if available
    let extractedName: string | null = null;
    let extractedPlace: string | null = null;

    if (fromName) {
      const result = extractProviderFromSenderName(fromName);
      extractedName = result.name;
      extractedPlace = result.place;
    }

    const providerId = await getOrCreateProvider(
      from,
      extractedName,
      extractedPlace || analysis.providerPlace || null
    );
    if (!providerId) {
      throw new Error(
        `Failed to get or create provider for ${extractedName || fromName} (${from})`
      );
    }

    // Get or create category based on LLM analysis
    let category;
    if (analysis.categoryId) {
      // Use existing category - validate it exists
      category = await prisma.category.findUnique({
        where: { id: analysis.categoryId },
        select: { id: true, name: true, isActive: true },
      });

      if (!category) {
        console.log(
          `⚠️  Category ID ${analysis.categoryId} not found, falling back to default`
        );
      } else if (!category.isActive) {
        console.log(
          `⚠️  Category ID ${analysis.categoryId} (${category.name}) is inactive, falling back to default`
        );
        category = null;
      } else {
        console.log(`✅ Using category: ${category.name} (${category.id})`);
      }
    }

    if (!category && analysis.newCategory) {
      // Validate parent category exists before creating new category
      let parentCategory = null;
      if (analysis.newCategory.parentCategoryId) {
        parentCategory = await prisma.category.findUnique({
          where: { id: analysis.newCategory.parentCategoryId, isActive: true },
        });
        if (!parentCategory) {
          console.log(
            `⚠️  Parent category ID ${analysis.newCategory.parentCategoryId} not found, creating category without parent`
          );
        }
      }

      try {
        // Create new category as suggested by LLM
        category = await prisma.category.create({
          data: {
            name: analysis.newCategory.name,
            slug: analysis.newCategory.slug,
            path: parentCategory
              ? `${parentCategory.path}/${analysis.newCategory.slug}`
              : `/category/${analysis.newCategory.slug}`,
            parentId: parentCategory ? parentCategory.id : null,
            sort: 100,
            isActive: true,
          },
        });
        console.log(`✅ Created new category: ${analysis.newCategory.name}`);
      } catch (error) {
        console.log(`❌ Failed to create new category: ${error}`);
        category = null; // Will fall back to default
      }
    }

    if (!category) {
      // Fallback: find or create a default "Обувь" category
      console.log(`🔄 Falling back to default category`);
      category = await prisma.category.findFirst({
        where: { name: 'Обувь', isActive: true },
      });

      if (!category) {
        try {
          category = await prisma.category.create({
            data: {
              name: 'Обувь',
              slug: 'obuv',
              path: '/obuv',
              sort: 100,
              isActive: true,
            },
          });
          console.log(`✅ Created default category: Обувь`);
        } catch (error) {
          console.log(`❌ Failed to create default category: ${error}`);
          throw new Error(
            `Failed to create or find any suitable category for product`
          );
        }
      } else {
        console.log(`✅ Using existing default category: Обувь`);
      }
    }

    // Create the final product directly with source message IDs
    const product = await prisma.product.create({
      data: {
        name: analysis.name || 'Untitled Product',
        slug,
        article: articleNumber,
        categoryId: category.id,
        providerId: providerId, // Add the provider ID
        description: analysis.description || '',
        material: analysis.material || '',
        gender: analysis.gender
          ? mapGender(analysis.gender)
          : inferGenderFromSizes(analysis.sizes as any) || undefined,
        season: mapSeason(analysis.season || 'AUTUMN'),
        pricePair: analysis.price || 0,
        currency: 'RUB',
        sourceMessageIds: sourceMessageIds, // Store WhatsApp message IDs directly
        source: 'WA', // Products from WhatsApp parser
        isActive: true, // Set as active immediately
        images: {
          create: images.map((image, index) => ({
            url: image.url,
            key: image.key || '',
            alt: `Product image ${index + 1}`,
            sort: index,
            isPrimary: index === 0,
            color: image.color || null,
            width: image.width || null,
            height: image.height || null,
          })),
        },
        sizes: (analysis.sizes || []).map(size => ({
          size: size.size,
          count: size.count || 1,
        })), // Convert to array of size objects
      } as any,
    });

    return product;
  }
}
