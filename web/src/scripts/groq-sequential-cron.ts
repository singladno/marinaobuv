import { prisma } from '../lib/db-node';
import { GroqSequentialProcessor } from '../lib/services/groq-sequential-processor';
import { fetchExtendedBatch } from '../lib/utils/batch-extender';
import { env } from '../lib/env';

/**
 * Groq Sequential Processing Cron Job
 * Processes messages in sequence: Group → Analysis → Colors
 */
async function main() {
  console.log('🚀 Starting Groq Sequential Processing Cron Job...');

  try {
    // Get extended batch of unprocessed messages (includes consecutive messages from same user)
    const batchSize = env.PROCESSING_BATCH_SIZE;
    const extendedBatch = await fetchExtendedBatch(
      batchSize,
      env.TARGET_GROUP_ID
    );

    if (extendedBatch.totalCount === 0) {
      console.log('✅ No unprocessed messages found');
      return;
    }

    console.log(
      `📊 Found ${extendedBatch.totalCount} unprocessed messages ` +
        `(original: ${batchSize}, extended: +${extendedBatch.extendedCount})`
    );

    // Initialize processor
    const processor = new GroqSequentialProcessor();

    // Process messages in batches (use original batch size for processing, not extended)
    const messageIds = extendedBatch.messageIds;

    for (let i = 0; i < messageIds.length; i += batchSize) {
      const batch = messageIds.slice(i, i + batchSize);

      console.log(
        `🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(messageIds.length / batchSize)} (${batch.length} messages)`
      );

      try {
        const result = await processor.processMessagesToProducts(batch);

        if (result.anyProcessed) {
          console.log(`✅ Batch processed successfully`);
        } else {
          console.log(`⚠️ No products created from this batch`);
        }

        // Small delay between batches to avoid rate limiting
        if (i + batchSize < messageIds.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ Error processing batch:`, error);
        // Continue with next batch even if this one fails
      }
    }

    console.log('🎉 Groq Sequential Processing completed');
  } catch (error) {
    console.error('❌ Error in Groq Sequential Processing:', error);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => {
      console.log('✅ Groq Sequential Processing finished');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Groq Sequential Processing failed:', error);
      process.exit(1);
    });
}

export { main };
