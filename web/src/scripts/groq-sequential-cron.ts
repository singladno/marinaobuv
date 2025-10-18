import { GroqSequentialProcessor } from '../lib/services/groq-sequential-processor';
import { fetchExtendedBatch } from '../lib/utils/batch-extender';
import { env } from '../lib/env';
import { scriptPrisma as prisma } from '../lib/script-db';

/**
 * Groq Sequential Processing Cron Job
 * Processes messages in sequence: Group → Analysis → Colors
 * Only processes unprocessed messages from the last N hours (configurable via MESSAGE_PROCESSING_HOURS)
 * Continues processing in cycles until no more recent unprocessed messages remain
 */
async function main() {
  console.log('🚀 Starting Groq Sequential Processing Cron Job...');

  try {
    const batchSize = env.PROCESSING_BATCH_SIZE;
    const hoursBack = env.MESSAGE_PROCESSING_HOURS;
    const processor = new GroqSequentialProcessor(prisma);
    let totalProcessed = 0;
    let cycleCount = 0;
    let totalUnprocessed = 0;

    // Calculate the cutoff time for messages (N hours back from now)
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    // Get initial count of unprocessed messages from the last N hours
    const initialCount = await prisma.whatsAppMessage.count({
      where: {
        processed: false,
        type: { in: ['imageMessage', 'extendedTextMessage', 'textMessage'] },
        chatId: env.TARGET_GROUP_ID,
        createdAt: {
          gte: cutoffTime, // Only messages from the last N hours
        },
      },
    });

    if (initialCount === 0) {
      console.log('✅ No unprocessed messages found');
      return;
    }

    totalUnprocessed = initialCount;
    console.log(
      `📊 Found ${totalUnprocessed} unprocessed messages from the last ${hoursBack} hours to process`
    );

    // Continue processing until no more unprocessed messages
    let currentOffset = 0;

    while (true) {
      cycleCount++;
      console.log(`\n🔄 Starting processing cycle ${cycleCount}...`);

      // Get extended batch of unprocessed messages with offset to prevent overlap
      const extendedBatch = await fetchExtendedBatch(
        batchSize,
        env.TARGET_GROUP_ID,
        currentOffset,
        hoursBack
      );

      if (extendedBatch.totalCount === 0) {
        console.log('✅ No more unprocessed messages found');
        break;
      }

      console.log(
        `📊 Processing ${extendedBatch.totalCount} messages ` +
          `(batch size: ${batchSize}, extended: +${extendedBatch.extendedCount}, offset: ${currentOffset})`
      );

      // Process the entire extended batch as one unit
      const messageIds = extendedBatch.messageIds;
      let cycleProcessed = 0;

      console.log(
        `🔄 Processing batch ${cycleCount} ` +
          `(${messageIds.length} messages: offset ${currentOffset} to ${currentOffset + messageIds.length})`
      );

      try {
        const result = await processor.processMessagesToProducts(messageIds);

        if (result.anyProcessed) {
          console.log(`✅ Batch processed successfully`);
          cycleProcessed += messageIds.length;
        } else {
          console.log(`⚠️ No products created from this batch`);
        }
      } catch (error) {
        console.error(`❌ Error processing batch:`, error);

        // Check if it's a JSON validation error from Groq
        if (
          error instanceof Error &&
          error.message.includes('json_validate_failed')
        ) {
          console.log(
            `🔄 Groq JSON validation error - this batch will be skipped and retried later`
          );
          console.log(
            `📝 Error details: ${error.message.substring(0, 200)}...`
          );
        }

        // Continue with next batch even if this one fails
        // Don't increment cycleProcessed for failed batches
      }

      // Update offset for next batch to prevent overlap
      currentOffset =
        extendedBatch.nextOffset || currentOffset + messageIds.length;

      totalProcessed += cycleProcessed;
      const remaining = totalUnprocessed - totalProcessed;
      const progressPercent = Math.round(
        (totalProcessed / totalUnprocessed) * 100
      );

      console.log(
        `📊 Cycle ${cycleCount} completed: ${cycleProcessed} messages processed`
      );
      console.log(
        `📊 Progress: ${totalProcessed}/${totalUnprocessed} (${progressPercent}%) - ${remaining} remaining`
      );
      console.log(`📊 Next offset: ${currentOffset}`);

      // Small delay between cycles to avoid overwhelming the system
      console.log('⏳ Waiting 2 seconds before next cycle...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`✅ Completed processing all available messages`);

    console.log(`🎉 Groq Sequential Processing completed!`);
    console.log(`📊 Total cycles: ${cycleCount}`);
    console.log(
      `📊 Total messages processed: ${totalProcessed}/${totalUnprocessed} (${Math.round((totalProcessed / totalUnprocessed) * 100)}%)`
    );
  } catch (error) {
    console.error('❌ Error in Groq Sequential Processing:', error);
    throw error;
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
