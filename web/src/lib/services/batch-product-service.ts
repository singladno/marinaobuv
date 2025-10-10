import { prisma } from '../db-node';
import { generateArticleNumber } from './product-creation-mappers';
import { createSlug } from './product-creation-mappers';
import { AnalysisValidationService } from './analysis-validation-service';
import OpenAI from 'openai';

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
  private validationService: AnalysisValidationService;
  private openai: OpenAI;

  constructor() {
    this.validationService = new AnalysisValidationService();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
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

    // Validate analysis result before updating
    if (!this.validationService.validateAnalysisResult(analysisResult)) {
      console.log(`❌ Analysis validation failed for product ${product.id}`);
      console.log(`❌ Product will be marked as failed and not activated`);

      // Cancel running color batch if it exists
      if (product.colorBatchId) {
        console.log(
          `🛑 Canceling color batch ${product.colorBatchId} for failed product ${product.id}`
        );
        await this.cancelColorBatch(product.colorBatchId);
      }

      // Mark product as failed instead of updating with invalid data
      await prisma.product.update({
        where: { id: product.id },
        data: {
          batchProcessingStatus: 'failed',
          name: 'Invalid Product - Missing Required Data',
          description: 'Product failed validation - missing required fields',
          colorBatchId: null, // Clear the color batch ID
        },
      });

      console.log(
        `❌ Product ${product.id} marked as failed due to validation`
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

    // Only activate if both batches completed successfully
    if (product.batchProcessingStatus === 'colors_complete') {
      // Final validation before activation
      if (
        !product.name ||
        product.name === 'Processing...' ||
        !product.pricePair ||
        Number(product.pricePair) <= 0 ||
        !product.sizes ||
        !Array.isArray(product.sizes) ||
        product.sizes.length === 0
      ) {
        console.log(
          `❌ Product ${productId} failed final validation - missing required data`
        );
        console.log(`   Name: ${product.name}`);
        console.log(`   Price: ${product.pricePair}`);
        console.log(`   Sizes: ${JSON.stringify(product.sizes)}`);
        await prisma.product.update({
          where: { id: productId },
          data: {
            batchProcessingStatus: 'failed',
            name: 'Invalid Product - Missing Required Data',
            description:
              'Product failed final validation - missing required fields',
          },
        });
        return;
      }

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
   * Cancel a running color batch
   */
  private async cancelColorBatch(colorBatchId: string): Promise<void> {
    try {
      console.log(`🛑 Cancelling color batch ${colorBatchId} on OpenAI API...`);

      // Find the actual OpenAI batch job for this color batch
      // The colorBatchId is a custom ID, we need to find the corresponding batch job
      const batchJob = await prisma.gptBatchJob.findFirst({
        where: { 
          type: 'colors',
          status: 'running'
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!batchJob) {
        console.log(`⚠️ No running color batch job found for ${colorBatchId}`);
        return;
      }

      // Cancel the batch directly on OpenAI API using the actual batch ID
      await this.openai.batches.cancel(batchJob.batchId);

      // Update our database record
      await prisma.gptBatchJob.update({
        where: { id: batchJob.id },
        data: { status: 'cancelled' },
      });
      console.log(`✅ Updated database: cancelled batch job ${batchJob.id} (OpenAI batch: ${batchJob.batchId})`);

      console.log(
        `✅ Successfully cancelled color batch ${colorBatchId} on OpenAI API`
      );
    } catch (error) {
      console.error(`❌ Error cancelling color batch ${colorBatchId}:`, error);

      // Even if OpenAI cancellation fails, mark as cancelled in our database
      const batchJob = await prisma.gptBatchJob.findFirst({
        where: { 
          type: 'colors',
          status: 'running'
        },
        orderBy: { createdAt: 'desc' }
      });

      if (batchJob) {
        await prisma.gptBatchJob.update({
          where: { id: batchJob.id },
          data: { status: 'cancelled' },
        });
        console.log(
          `✅ Marked batch job ${batchJob.id} as cancelled in database`
        );
      }
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
