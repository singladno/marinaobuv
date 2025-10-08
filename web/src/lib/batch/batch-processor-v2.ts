import { prisma } from '../db-node';
import { MessageGroupingService } from '../services/message-grouping-service';
import { BatchProductService } from '../services/batch-product-service';
import {
  buildAnalysisLine,
  buildColorLine,
  serializeLines,
} from './batch-builder';
import { submitBatchFromLines } from './openai-batch';

export interface BatchProcessingResult {
  anyProcessed: boolean;
  finalizedMessageIds: string[];
}

/**
 * Updated Batch Processor that solves group ID collision issues
 * by creating inactive products immediately with unique batch IDs
 */
export class BatchProcessorV2 {
  private groupingService: MessageGroupingService;
  private batchProductService: BatchProductService;

  constructor() {
    this.groupingService = new MessageGroupingService();
    this.batchProductService = new BatchProductService();
  }

  /**
   * Process messages using the new collision-free approach
   */
  async processMessagesToProducts(
    messageIds: string[]
  ): Promise<BatchProcessingResult> {
    console.log(
      `🚀 Processing ${messageIds.length} messages with collision-free batch processing...`
    );

    // PHASE 1: Group messages only (direct API)
    console.log(`📊 Phase 1: Grouping ${messageIds.length} messages...`);
    const messageGroups = await this.groupingService.groupMessages(messageIds);

    if (messageGroups.length === 0) {
      console.log(`⚠️  No product groups found.`);
      return { anyProcessed: false, finalizedMessageIds: [] };
    }

    console.log(`✅ Phase 1 Complete: Found ${messageGroups.length} groups`);

    // PHASE 2: Create inactive products with unique batch IDs
    console.log(
      `📊 Phase 2: Creating inactive products with unique batch IDs...`
    );
    const productResults: Array<{
      productId: string;
      analysisBatchId: string;
      colorBatchId: string;
      messageIds: string[];
    }> = [];

    for (const group of messageGroups) {
      try {
        const result = await this.batchProductService.createInactiveProduct({
          messageIds: group.messageIds,
          productContext: group.productContext,
          confidence: group.confidence,
        });

        productResults.push({
          productId: result.productId,
          analysisBatchId: result.analysisBatchId,
          colorBatchId: result.colorBatchId,
          messageIds: group.messageIds,
        });

        console.log(
          `✅ Created product ${result.productId} for group ${group.groupId}`
        );
      } catch (error) {
        console.error(
          `❌ Failed to create product for group ${group.groupId}:`,
          error
        );
      }
    }

    if (productResults.length === 0) {
      console.log(`⚠️  No products created.`);
      return { anyProcessed: false, finalizedMessageIds: [] };
    }

    // PHASE 3: Prepare and submit batch requests
    console.log(
      `📊 Phase 3: Preparing batch requests for ${productResults.length} products...`
    );
    const batchRequests = await this.prepareBatchRequests(productResults);

    if (
      batchRequests.analysisLines.length === 0 &&
      batchRequests.colorLines.length === 0
    ) {
      console.log(`⚠️  No batch requests to submit.`);
      return { anyProcessed: false, finalizedMessageIds: [] };
    }

    // Submit all batches to OpenAI
    const batchJobs = await this.submitBatchJobs(batchRequests);
    console.log(
      `📤 Phase 3 Complete: Submitted ${batchJobs.length} batch jobs to OpenAI`
    );
    console.log(
      `⏳ Phase 4: Batch polling will happen via batch-poll-v2.ts (every 5 minutes)`
    );
    console.log(`💡 Products will be activated when batches complete`);

    return { anyProcessed: true, finalizedMessageIds: [] };
  }

  /**
   * Prepare batch requests for all products
   */
  private async prepareBatchRequests(
    productResults: Array<{
      productId: string;
      analysisBatchId: string;
      colorBatchId: string;
      messageIds: string[];
    }>
  ) {
    const analysisLines: string[] = [];
    const colorLines: string[] = [];

    for (const product of productResults) {
      // Get messages for this product
      const messages = await prisma.whatsAppMessage.findMany({
        where: { id: { in: product.messageIds } },
        orderBy: { createdAt: 'asc' },
      });

      if (messages.length === 0) continue;

      // Prepare text content
      const textContents = messages
        .map(m => m.text)
        .filter(Boolean)
        .join('\n\n');

      // Prepare image URLs
      const imageUrls = messages
        .filter(m => m.type === 'image' && m.mediaUrl)
        .map(m => m.mediaUrl!);

      if (textContents && imageUrls.length > 0) {
        // Create analysis batch line
        const analysisLine = buildAnalysisLine(
          product.analysisBatchId, // Use unique batch ID as custom_id
          textContents,
          imageUrls,
          `Product context for ${product.productId}`
        );
        analysisLines.push(serializeLines([analysisLine]));

        // Create color batch lines for each image
        for (let i = 0; i < imageUrls.length; i++) {
          const colorLine = buildColorLine(
            `${product.colorBatchId}:${i}`, // Use unique batch ID with image index
            imageUrls[i]
          );
          colorLines.push(serializeLines([colorLine]));
        }
      }
    }

    return { analysisLines, colorLines };
  }

  /**
   * Submit batch jobs to OpenAI
   */
  private async submitBatchJobs(batchRequests: {
    analysisLines: string[];
    colorLines: string[];
  }) {
    const batchJobs: string[] = [];

    // Submit analysis batch
    if (batchRequests.analysisLines.length > 0) {
      const analysisContent = batchRequests.analysisLines.join('\n');
      const analysisBatchId = await submitBatchFromLines(
        analysisContent,
        'analysis'
      );
      batchJobs.push(analysisBatchId);
    }

    // Submit color batch
    if (batchRequests.colorLines.length > 0) {
      const colorContent = batchRequests.colorLines.join('\n');
      const colorBatchId = await submitBatchFromLines(colorContent, 'colors');
      batchJobs.push(colorBatchId);
    }

    return batchJobs;
  }
}
