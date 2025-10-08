import { prisma } from '../db-node';
import { MessageGroupingService } from '../services/message-grouping-service';
import { UnifiedAnalysisService } from '../services/unified-analysis-service';
import { PerImageColorService } from '../services/per-image-color-service';
import {
  buildGroupingLine,
  buildAnalysisLine,
  buildColorLine,
  serializeLines,
} from './batch-builder';
import {
  submitBatchFromLines,
  pollBatch,
  downloadBatchResults,
} from './openai-batch';
import { MessageProcessor } from '../processors/MessageProcessor';
import { ImageProcessingService } from '../services/image-processing-service';
import { ProductCreationService } from '../services/product-creation-service';

export interface BatchProcessingResult {
  anyProcessed: boolean;
  finalizedMessageIds: string[];
}

export class BatchProcessor {
  private groupingService: MessageGroupingService;
  private analysisService: UnifiedAnalysisService;
  private colorService: PerImageColorService;
  private messageProcessor: MessageProcessor;
  private imageService: ImageProcessingService;
  private productService: ProductCreationService;

  constructor() {
    this.groupingService = new MessageGroupingService();
    this.analysisService = new UnifiedAnalysisService();
    this.colorService = new PerImageColorService();
    this.messageProcessor = new MessageProcessor();
    this.imageService = new ImageProcessingService();
    this.productService = new ProductCreationService();
  }

  /**
   * Process messages using OpenAI Batch API for cost efficiency
   * Phase 1: Group messages only
   * Phase 2: Submit all batches to OpenAI
   * Phase 3: Polling happens separately via batch-poll.ts
   */
  async processMessagesToProducts(
    messageIds: string[]
  ): Promise<BatchProcessingResult> {
    console.log(
      `🚀 Processing ${messageIds.length} messages with OpenAI Batch API...`
    );

    // PHASE 1: Group messages only (direct API)
    console.log(`📊 Phase 1: Grouping ${messageIds.length} messages...`);
    const messageGroups = await this.groupingService.groupMessages(messageIds);

    if (messageGroups.length === 0) {
      console.log(`⚠️  No product groups found.`);
      return { anyProcessed: false, finalizedMessageIds: [] };
    }

    console.log(`✅ Phase 1 Complete: Found ${messageGroups.length} groups`);

    // PHASE 2: Prepare and submit all batch requests
    console.log(
      `📊 Phase 2: Preparing batch requests for ${messageGroups.length} groups...`
    );
    const batchRequests = await this.prepareBatchRequests(messageGroups);

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
      `📤 Phase 2 Complete: Submitted ${batchJobs.length} batch jobs to OpenAI`
    );
    console.log(
      `⏳ Phase 3: Batch polling will happen via batch-poll.ts (every 5 minutes)`
    );
    console.log(
      `💡 Batches will be processed when OpenAI completes them (usually 5-30 minutes)`
    );

    // Store group metadata for batch polling
    await this.storeGroupMetadata(messageGroups);

    // Return immediately - don't wait for results
    // Results will be processed by the batch poller
    return { anyProcessed: true, finalizedMessageIds: [] };
  }

  /**
   * Prepare batch requests for all groups
   */
  private async prepareBatchRequests(messageGroups: any[]) {
    const analysisLines: string[] = [];
    const colorLines: string[] = [];

    for (const group of messageGroups) {
      // Fetch messages for this group
      const messages = await this.messageProcessor.fetchGroupMessages(
        group.messageIds
      );
      if (messages.length === 0) continue;

      // Extract text and images
      const textContents = this.messageProcessor.extractTextContent(messages);
      const imageUrls = messages
        .filter(
          msg =>
            (msg.type === 'image' || msg.type === 'imageMessage') &&
            msg.mediaUrl
        )
        .map(msg => msg.mediaUrl!);

      if (textContents.length > 0 || imageUrls.length > 0) {
        // Prepare analysis request
        const analysisLine = buildAnalysisLine(
          `analysis:${group.groupId}`,
          textContents.join('\n\n'),
          imageUrls,
          group.productContext
        );
        analysisLines.push(JSON.stringify(analysisLine));

        // Prepare color requests for each image
        for (let i = 0; i < imageUrls.length; i++) {
          const colorLine = buildColorLine(
            `color:${group.groupId}:${i}`,
            imageUrls[i]
          );
          colorLines.push(JSON.stringify(colorLine));
        }
      }
    }

    return { analysisLines, colorLines };
  }

  /**
   * Submit batch jobs to OpenAI
   */
  private async submitBatchJobs(requests: {
    analysisLines: string[];
    colorLines: string[];
  }) {
    const batchJobs = [];

    // Submit analysis batch
    if (requests.analysisLines.length > 0) {
      const analysisBatchId = await submitBatchFromLines(
        requests.analysisLines.join('\n'),
        'analysis'
      );
      batchJobs.push({
        type: 'analysis',
        batchId: analysisBatchId,
        groupIds: this.extractGroupIds(requests.analysisLines),
      });
    }

    // Submit color batch
    if (requests.colorLines.length > 0) {
      const colorBatchId = await submitBatchFromLines(
        requests.colorLines.join('\n'),
        'colors'
      );
      batchJobs.push({
        type: 'colors',
        batchId: colorBatchId,
        groupIds: this.extractGroupIds(requests.colorLines),
      });
    }

    return batchJobs;
  }

  // Note: Polling and result processing happens in batch-poll.ts
  // This keeps the batch processor focused on submission only

  /**
   * Parse batch results from JSONL file
   */
  private async parseBatchResults(filePath: string): Promise<any[]> {
    const fs = await import('fs');
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return content
      .trim()
      .split('\n')
      .map(line => JSON.parse(line));
  }

  /**
   * Process analysis results and create products
   */
  private async processAnalysisResults(
    results: any[],
    messageGroups: any[]
  ): Promise<{ anyProcessed: boolean; finalizedMessageIds: string[] }> {
    let anyProcessed = false;
    const allFinalized: string[] = [];

    for (const result of results) {
      if (result.response?.body?.choices?.[0]?.message?.content) {
        const groupId = result.custom_id.replace('analysis:', '');
        const group = messageGroups.find(g => g.groupId === groupId);

        if (group) {
          try {
            // Parse the analysis result
            const analysisData = JSON.parse(
              result.response.body.choices[0].message.content
            );

            // Create product from analysis using the existing service
            const product =
              await this.productService.createDraftProductFromAnalysis({
                messageId: group.messageIds[0], // Use first message ID
                from: 'batch_processing',
                fromName: 'Batch Processing',
                analysis: analysisData,
                images: [], // Will be populated later
                context: group.productContext,
                sourceMessageIds: group.messageIds,
              });

            if (product) {
              anyProcessed = true;
              allFinalized.push(...group.messageIds);
              console.log(
                `✅ Created product from batch analysis for group ${groupId}`
              );
            }
          } catch (error) {
            console.error(
              `❌ Error processing analysis result for group ${groupId}:`,
              error
            );
          }
        }
      }
    }

    return { anyProcessed, finalizedMessageIds: allFinalized };
  }

  /**
   * Process color results
   */
  private async processColorResults(results: any[]): Promise<void> {
    for (const result of results) {
      if (result.response?.body?.choices?.[0]?.message?.content) {
        const customId = result.custom_id;
        const colors = JSON.parse(
          result.response.body.choices[0].message.content
        );

        // Store color results (you can implement this based on your needs)
        console.log(`🎨 Color results for ${customId}:`, colors);
      }
    }
  }

  /**
   * Extract group IDs from batch lines
   */
  private extractGroupIds(lines: string[]): string[] {
    return lines.map(line => {
      const parsed = JSON.parse(line);
      return parsed.custom_id.split(':')[1]; // Extract group ID
    });
  }

  /**
   * Store group metadata for batch polling
   */
  private async storeGroupMetadata(messageGroups: any[]) {
    // Store group metadata in a simple way for now
    // In a production system, you might want to store this in a dedicated table
    for (const group of messageGroups) {
      // Update messages with group metadata
      await prisma.whatsAppMessage.updateMany({
        where: { id: { in: group.messageIds } },
        data: {
          aiGroupId: group.groupId,
          // Store product context in a way that can be retrieved later
        },
      });
    }
  }
}
