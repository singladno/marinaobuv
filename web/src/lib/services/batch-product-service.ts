import { prisma } from '../db-node';
import { generateArticleNumber } from './product-creation-mappers';
import { createSlug } from './product-creation-mappers';

export interface CreateInactiveProductParams {
  messageIds: string[];
  productContext: string;
  confidence: number;
}

export interface BatchProductResult {
  productId: string;
  analysisBatchId: string;
  colorBatchId: string;
}

/**
 * Service for creating inactive products with batch IDs
 * This solves the group ID collision issue by creating products immediately
 * and using unique batch IDs to track analysis and color processing
 */
export class BatchProductService {
  /**
   * Create an inactive product for a group of messages
   * This product will be activated when both analysis and color batches complete
   */
  async createInactiveProduct({
    messageIds,
    productContext,
    confidence,
  }: CreateInactiveProductParams): Promise<BatchProductResult> {
    // Generate unique batch IDs
    const analysisBatchId = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const colorBatchId = `color_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Get the first message for basic info
    const firstMessage = await prisma.whatsAppMessage.findFirst({
      where: { id: { in: messageIds } },
      orderBy: { createdAt: 'asc' },
    });

    if (!firstMessage) {
      throw new Error('No messages found for product creation');
    }

    // Create inactive product with batch IDs
    const product = await prisma.product.create({
      data: {
        name: 'Processing...', // Temporary name, will be updated when analysis completes
        slug: createSlug(`product-${Date.now()}`),
        article: generateArticleNumber(),
        categoryId: await this.getDefaultCategoryId(),
        pricePair: 0, // Will be updated when analysis completes
        currency: 'RUB',
        description: 'Product is being processed...',
        isActive: false, // Inactive until processing completes
        sourceMessageIds: messageIds,
        analysisBatchId,
        colorBatchId,
        batchProcessingStatus: 'pending',
      },
    });

    // Mark messages as processed (they're now linked to this product)
    await prisma.whatsAppMessage.updateMany({
      where: { id: { in: messageIds } },
      data: {
        processed: true,
        // Remove aiGroupId since we're using product-based tracking now
        aiGroupId: null,
      },
    });

    console.log(`✅ Created inactive product ${product.id} with batch IDs:`);
    console.log(`   Analysis: ${analysisBatchId}`);
    console.log(`   Colors: ${colorBatchId}`);

    return {
      productId: product.id,
      analysisBatchId,
      colorBatchId,
    };
  }

  /**
   * Update product when analysis batch completes
   */
  async updateProductWithAnalysis(
    analysisBatchId: string,
    analysisResult: any
  ): Promise<void> {
    const product = await prisma.product.findUnique({
      where: { analysisBatchId },
    });

    if (!product) {
      console.error(
        `❌ Product not found for analysis batch ${analysisBatchId}`
      );
      return;
    }

    // Update product with analysis results
    await prisma.product.update({
      where: { id: product.id },
      data: {
        name: analysisResult.name || 'Untitled Product',
        description: analysisResult.description || '',
        material: analysisResult.material || '',
        pricePair: analysisResult.price || 0,
        gender: analysisResult.gender || null,
        season: analysisResult.season || null,
        sizes: analysisResult.sizes || [],
        batchProcessingStatus: 'analysis_complete',
      },
    });

    console.log(`✅ Updated product ${product.id} with analysis results`);
  }

  /**
   * Update product when color batch completes
   */
  async updateProductWithColors(
    colorBatchId: string,
    colorResults: any[]
  ): Promise<void> {
    const product = await prisma.product.findUnique({
      where: { colorBatchId },
    });

    if (!product) {
      console.error(`❌ Product not found for color batch ${colorBatchId}`);
      return;
    }

    // Update product with color results
    await prisma.product.update({
      where: { id: product.id },
      data: {
        batchProcessingStatus: 'colors_complete',
      },
    });

    console.log(`✅ Updated product ${product.id} with color results`);
  }

  /**
   * Activate product when both batches complete
   */
  async activateProduct(productId: string): Promise<void> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      console.error(`❌ Product ${productId} not found`);
      return;
    }

    if (product.batchProcessingStatus === 'colors_complete') {
      await prisma.product.update({
        where: { id: productId },
        data: {
          isActive: true,
          batchProcessingStatus: 'completed',
        },
      });

      console.log(`✅ Activated product ${productId}`);
    }
  }

  /**
   * Get default category ID
   */
  private async getDefaultCategoryId(): Promise<string> {
    const category = await prisma.category.findFirst({
      where: { name: 'Обувь' },
    });

    if (!category) {
      throw new Error('Default category not found');
    }

    return category.id;
  }
}
