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
      type: { in: ['text', 'image'] },
      // Remove text requirement - allow image-only messages
      OR: [
        { text: { not: null } }, // Messages with text
        { type: 'image' }, // Image messages (even without text)
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true },
  });

  return messages.map(msg => msg.id);
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

    // Get initial product count
    const initialProductCount = await prisma.waDraftProduct.count();

    // Get total count of messages that need processing
    const totalMessages = await prisma.whatsAppMessage.count({
      where: {
        processed: false,
        type: { in: ['text', 'image'] },
        OR: [{ text: { not: null } }, { type: 'image' }],
      },
    });

    console.log(`Found ${totalMessages} messages to process`);

    if (totalMessages === 0) {
      console.log('No messages to process');
      return;
    }

    // Initialize unified processor
    const processor = new UnifiedOpenAIProcessor();

    // Process messages in batches
    let processedCount = 0;
    let batchNumber = 1;

    while (processedCount < totalMessages) {
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

      // Process this batch
      await processor.processMessagesToProducts(messageIds);

      // Mark messages as processed
      await prisma.whatsAppMessage.updateMany({
        where: { id: { in: messageIds } },
        data: { processed: true },
      });

      processedCount += messageIds.length;
      batchNumber++;

      // Get current product count and calculate new products created
      const currentProductCount = await prisma.waDraftProduct.count();
      const newProductsCreated = currentProductCount - initialProductCount;

      // Update progress with current counts
      if (parsingProgressService) {
        await parsingProgressService.updateCounts(
          processedCount,
          newProductsCreated
        );
      }

      console.log(
        `✅ Batch ${batchNumber - 1} complete! Processed ${processedCount}/${totalMessages} messages, Created ${newProductsCreated} products`
      );
    }

    // Get final product count
    const finalProductCount = await prisma.waDraftProduct.count();
    productsCreated = finalProductCount - initialProductCount;

    console.log('✅ All processing complete!');
    console.log(`📊 Total products created: ${productsCreated}`);
    console.log('All products are now ready for approval in the admin panel.');

    // Mark as completed with final counts
    if (parsingProgressService) {
      await parsingProgressService.markCompleted(
        processedCount,
        productsCreated
      );
    }
  } catch (error) {
    console.error('Failed to process draft products:', error);

    // Mark as failed in progress tracking
    if (parsingProgressService) {
      await parsingProgressService.markFailed(
        error instanceof Error
          ? error.message
          : 'Unknown error during product processing'
      );
    }

    process.exitCode = 1;
  } finally {
    // Clean up signal handlers
    cleanupSignalHandlers();
    await prisma.$disconnect();
  }
}

// Run the script
main().catch(console.error);
