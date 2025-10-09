import { prisma } from '../db-node';
import { submitBatchFromLines } from '../batch/openai-batch';
import {
  buildAnalysisLine,
  buildColorLine,
  serializeLines,
} from '../batch/batch-builder';

/**
 * Service for handling batch retries and resubmission
 */
export class BatchRetryService {
  /**
   * Resubmit failed batch for a specific product
   */
  async resubmitFailedBatch(
    productId: string,
    newAnalysisBatchId: string,
    newColorBatchId: string
  ): Promise<{ analysisBatchId?: string; colorBatchId?: string }> {
    console.log(`🔄 Resubmitting failed batch for product ${productId}...`);

    // Get the product with its messages
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    // Get the original messages for this product
    const sourceMessageIds = product.sourceMessageIds as string[] | null;
    if (!sourceMessageIds || sourceMessageIds.length === 0) {
      throw new Error(`No source message IDs found for product ${productId}`);
    }

    const messages = await prisma.whatsAppMessage.findMany({
      where: { id: { in: sourceMessageIds } },
      orderBy: { createdAt: 'asc' },
    });

    if (messages.length === 0) {
      throw new Error(`No messages found for product ${productId}`);
    }

    // Prepare text content
    const textContents = messages
      .map(m => m.text)
      .filter(Boolean)
      .join('\n\n');

    // Prepare image URLs
    const imageUrls = messages
      .filter(m => m.type === 'image' && m.mediaUrl)
      .map(m => m.mediaUrl!);

    const batchJobs: string[] = [];

    // Resubmit analysis batch if we have text content
    if (textContents && imageUrls.length > 0) {
      console.log(`📊 Resubmitting analysis batch for product ${productId}...`);

      const analysisLine = buildAnalysisLine(
        newAnalysisBatchId,
        textContents,
        imageUrls,
        `Product context for ${productId}`
      );

      const analysisContent = serializeLines([analysisLine]);
      const analysisBatchId = await submitBatchFromLines(
        analysisContent,
        'analysis'
      );
      batchJobs.push(analysisBatchId);

      console.log(`✅ Analysis batch resubmitted: ${analysisBatchId}`);
    }

    // Resubmit color batch if we have images
    if (imageUrls.length > 0) {
      console.log(`🎨 Resubmitting color batch for product ${productId}...`);

      const colorLines: string[] = [];
      for (let i = 0; i < imageUrls.length; i++) {
        const colorLine = buildColorLine(
          `${newColorBatchId}:${i}`,
          imageUrls[i]
        );
        colorLines.push(serializeLines([colorLine]));
      }

      const colorContent = colorLines.join('\n');
      const colorBatchId = await submitBatchFromLines(colorContent, 'colors');
      batchJobs.push(colorBatchId);

      console.log(`✅ Color batch resubmitted: ${colorBatchId}`);
    }

    console.log(
      `🎉 Successfully resubmitted ${batchJobs.length} batches for product ${productId}`
    );

    return {
      analysisBatchId: batchJobs.find(id => id.includes('analysis')),
      colorBatchId: batchJobs.find(id => id.includes('color')),
    };
  }

  /**
   * Resubmit all failed batches for products with new batch IDs
   */
  async resubmitAllFailedBatches(): Promise<number> {
    console.log('🔄 Resubmitting all failed batches...');

    // Find products that have new batch IDs but no corresponding running batches
    const productsWithNewBatchIds = await prisma.product.findMany({
      where: {
        batchProcessingStatus: 'pending',
        OR: [
          { analysisBatchId: { not: null } },
          { colorBatchId: { not: null } },
        ],
      },
    });

    let resubmittedCount = 0;

    for (const product of productsWithNewBatchIds) {
      try {
        // Check if batches are already running for this product
        const existingBatches = await prisma.gptBatchJob.findMany({
          where: {
            OR: [
              { batchId: product.analysisBatchId },
              { batchId: product.colorBatchId },
            ],
            status: { in: ['running', 'validating'] },
          },
        });

        if (existingBatches.length > 0) {
          console.log(
            `⏳ Product ${product.id} already has running batches, skipping...`
          );
          continue;
        }

        // Resubmit the failed batch
        await this.resubmitFailedBatch(
          product.id,
          product.analysisBatchId!,
          product.colorBatchId!
        );

        resubmittedCount++;
      } catch (error) {
        console.error(
          `❌ Failed to resubmit batch for product ${product.id}:`,
          error
        );
      }
    }

    console.log(`✅ Resubmitted ${resubmittedCount} failed batches`);
    return resubmittedCount;
  }
}
