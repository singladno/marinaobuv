#!/usr/bin/env tsx

// Load environment variables from .env.local FIRST (override any existing shell vars)
import { config } from 'dotenv';
config({ path: '.env.local', override: true });

// Now import other modules after env is loaded
import { prisma } from '../lib/db-node';
import { UnifiedOpenAIProcessor } from '../lib/unified-openai-processor-v2';
import { ParsingProgressService } from '../lib/services/parsing-progress-service';
import {
  initializeParsingSignalHandlers,
  cleanupSignalHandlers,
} from '../lib/services/parsing-signal-handler';

// Import env after dotenv is configured
let env: any;
try {
  // Clear the module cache to force re-import
  const envModule = await import('../lib/env');
  env = envModule.env;
} catch (error) {
  console.error('Failed to load env:', error);
  process.exit(1);
}

/**
 * Unified draft product processing script
 * Replaces the old 3-step process (YandexGPT grouping + text parsing + OpenAI image analysis)
 * with a single 2-step process (OpenAI grouping + unified text+image analysis)
 */
async function getMessagesForProcessing(limit: number = 50): Promise<string[]> {
  const messages = await prisma.whatsAppMessage.findMany({
    where: {
      processed: false,
      type: {
        in: [
          'text',
          'image',
          'textMessage',
          'imageMessage',
          'extendedTextMessage',
        ],
      },
      // Remove text requirement - allow image-only messages
      OR: [
        { text: { not: null } }, // Messages with text
        { type: { in: ['image', 'imageMessage'] } }, // Image messages (even without text)
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true },
  });

  return messages.map(msg => msg.id);
}

/**
 * Process a batch with timeout protection
 */
async function processBatchWithTimeout(
  processor: UnifiedOpenAIProcessor,
  messageIds: string[],
  timeoutMs: number
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      console.log(`⏰ Batch timed out after ${timeoutMs / 1000}s, skipping...`);
      reject(new Error(`Batch timed out after ${timeoutMs / 1000}s`));
    }, timeoutMs);

    try {
      await processor.processMessagesToProducts(messageIds);
      clearTimeout(timeout);
      resolve();
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
}

async function main() {
  let parsingProgressService: ParsingProgressService | null = null;
  let productsCreated = 0;

  try {
    // Initialize parsing progress service if parsing history ID is provided
    const parsingHistoryId = process.env.PARSING_HISTORY_ID;
    if (parsingHistoryId) {
      parsingProgressService = new ParsingProgressService(parsingHistoryId);
      console.log(
        `📊 Real-time progress tracking enabled for parsing ID: ${parsingHistoryId}`
      );

      // Initialize signal handlers for graceful shutdown
      initializeParsingSignalHandlers(parsingProgressService);
    }

    console.log('Starting unified draft product processing with OpenAI...');
    console.log(
      'This replaces the old 3-step process with a unified 2-step approach:'
    );
    console.log('1. OpenAI groups messages');
    console.log('2. OpenAI analyzes text + images together');
    console.log('');

    // Get initial product count (final products, not drafts)
    const initialProductCount = await prisma.product.count();

    // Get total count of messages that need processing
    const totalMessages = await prisma.whatsAppMessage.count({
      where: {
        processed: false,
        type: {
          in: [
            'text',
            'image',
            'textMessage',
            'imageMessage',
            'extendedTextMessage',
          ],
        },
        OR: [
          { text: { not: null } },
          { type: { in: ['image', 'imageMessage'] } },
        ],
      },
    });

    console.log(`Found ${totalMessages} messages to process`);

    if (totalMessages === 0) {
      console.log('No messages to process');
      return;
    }

    // Initialize unified processor
    const processor = new UnifiedOpenAIProcessor();

    // Process messages in batches with timeout protection
    let processedCount = 0;
    let batchNumber = 1;
    let failedBatches = 0;
    const maxFailedBatches = 3; // Allow up to 3 failed batches before stopping

    while (processedCount < totalMessages && failedBatches < maxFailedBatches) {
      console.log(`\n🔄 Processing batch ${batchNumber}...`);

      const messageIds = await getMessagesForProcessing(
        env.PROCESSING_BATCH_SIZE
      );

      if (messageIds.length === 0) {
        console.log('No more messages to process');
        break;
      }

      console.log(
        `Processing ${messageIds.length} messages in batch ${batchNumber}`
      );

      try {
        // Process this batch with timeout protection
        await processBatchWithTimeout(processor, messageIds, 15 * 60 * 1000); // 15 minute timeout per batch

        // Mark messages as processed only if successful
        await prisma.whatsAppMessage.updateMany({
          where: { id: { in: messageIds } },
          data: { processed: true },
        });

        processedCount += messageIds.length;
        failedBatches = 0; // Reset failed counter on success
        console.log(`✅ Batch ${batchNumber} completed successfully`);
      } catch (error) {
        failedBatches++;
        console.error(`❌ Batch ${batchNumber} failed:`, error);
        console.log(
          `⚠️  Skipping batch ${batchNumber} and continuing with next batch...`
        );

        // Don't mark messages as processed if batch failed
        // They can be retried in the next run
        continue;
      }

      batchNumber++;

      // Get current product count and calculate new products created
      const currentProductCount = await prisma.product.count();
      const newProductsCreated = currentProductCount - initialProductCount;

      // Update progress with current counts
      if (parsingProgressService) {
        await parsingProgressService.updateCounts(
          processedCount,
          newProductsCreated
        );
      }

      console.log(
        `📊 Progress: Processed ${processedCount}/${totalMessages} messages, Created ${newProductsCreated} products`
      );
    }

    if (failedBatches >= maxFailedBatches) {
      console.log(
        `⚠️  Stopping processing after ${maxFailedBatches} consecutive failed batches`
      );
    }

    // Get final product count
    const finalProductCount = await prisma.product.count();
    productsCreated = finalProductCount - initialProductCount;

    console.log('✅ Processing complete!');
    console.log(`📊 Total products created: ${productsCreated}`);
    console.log(`📊 Total messages processed: ${processedCount}`);

    if (failedBatches > 0) {
      console.log(
        `⚠️  Some batches failed (${failedBatches} failed batches), but processing continued`
      );
    }

    // Mark as completed with final counts (even if some batches failed)
    if (parsingProgressService) {
      if (failedBatches > 0) {
        await parsingProgressService.markPartialCompletion(
          processedCount,
          productsCreated,
          `Processing completed with ${failedBatches} failed batches`
        );
      } else {
        await parsingProgressService.markCompleted(
          processedCount,
          productsCreated
        );
      }
    }
  } catch (error) {
    console.error('Failed to process draft products:', error);

    // Mark as partial completion instead of complete failure
    if (parsingProgressService) {
      const currentProductCount = await prisma.product.count();
      const initialProductCount = await prisma.product.count(); // Get current count as fallback
      const finalProductsCreated = currentProductCount - initialProductCount;

      await parsingProgressService.markPartialCompletion(
        0, // Use 0 as fallback for processedCount
        finalProductsCreated,
        `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Don't exit with error code - allow partial completion
    console.log('⚠️  Processing completed with errors, but some work was done');
  } finally {
    // Clean up signal handlers
    cleanupSignalHandlers();
    await prisma.$disconnect();
  }
}

// Run the script
main().catch(console.error);
