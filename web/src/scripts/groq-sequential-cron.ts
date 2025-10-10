import { prisma } from '../lib/db-node';
import { GroqSequentialProcessor } from '../lib/services/groq-sequential-processor';

/**
 * Groq Sequential Processing Cron Job
 * Processes messages in sequence: Group → Analysis → Colors
 */
async function main() {
  console.log('🚀 Starting Groq Sequential Processing Cron Job...');

  try {
    // Get unprocessed messages
    const unprocessedMessages = await prisma.whatsAppMessage.findMany({
      where: {
        processed: false,
        type: { in: ['textMessage', 'imageMessage', 'extendedTextMessage'] },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(process.env.PROCESSING_BATCH_SIZE || '50'), // Process messages in batches
    });

    if (unprocessedMessages.length === 0) {
      console.log('✅ No unprocessed messages found');
      return;
    }

    console.log(`📊 Found ${unprocessedMessages.length} unprocessed messages`);

    // Initialize processor
    const processor = new GroqSequentialProcessor();

    // Process messages in batches
    const batchSize = parseInt(process.env.PROCESSING_BATCH_SIZE || '20'); // Process messages in batches
    const messageIds = unprocessedMessages.map(m => m.id);

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
if (require.main === module) {
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
