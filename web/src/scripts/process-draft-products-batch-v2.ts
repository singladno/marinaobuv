#!/usr/bin/env tsx

import { prisma } from '../lib/db-node';
import { BatchProcessorV2 } from '../lib/batch/batch-processor-v2';

/**
 * Updated batch processing script that solves group ID collision issues
 * by creating inactive products immediately with unique batch IDs
 */
async function main() {
  console.log('🚀 Starting collision-free batch processing...');

  // Get total unprocessed messages count first
  const totalUnprocessed = await prisma.whatsAppMessage.count({
    where: {
      processed: false,
      type: { in: ['textMessage', 'imageMessage'] },
      OR: [{ text: { not: null } }, { mediaUrl: { not: null } }],
    },
  });

  console.log(`📊 Total unprocessed messages: ${totalUnprocessed}`);

  let totalProcessed = 0;
  let batchNumber = 1;

  while (true) {
    // Get unprocessed messages with smart batching to ensure text+image mix
    const batchSize = parseInt(process.env.PROCESSING_BATCH_SIZE || '100');

    // First, try to get a batch that includes both text and image messages
    const unprocessedMessages = await prisma.whatsAppMessage.findMany({
      where: {
        processed: false,
        type: { in: ['textMessage', 'imageMessage'] },
        OR: [{ text: { not: null } }, { mediaUrl: { not: null } }],
      },
      orderBy: { createdAt: 'asc' },
      take: batchSize * 2, // Get more messages to filter from
    });

    // Filter to ensure we have a good mix of text and image messages
    const textMessages = unprocessedMessages.filter(
      m =>
        m.type === 'textMessage' &&
        m.text &&
        m.text.trim() !== '' &&
        m.text.toLowerCase() !== 'null'
    );

    const imageMessages = unprocessedMessages.filter(
      m => m.type === 'imageMessage' && m.mediaUrl
    );

    // If we have both text and image messages, take a balanced sample
    let selectedMessages: typeof unprocessedMessages = [];
    if (textMessages.length > 0 && imageMessages.length > 0) {
      // Take up to 50% text, 50% images, but prioritize recent messages
      const maxText = Math.min(Math.ceil(batchSize * 0.5), textMessages.length);
      const maxImages = Math.min(batchSize - maxText, imageMessages.length);

      selectedMessages = [
        ...textMessages.slice(0, maxText),
        ...imageMessages.slice(0, maxImages),
      ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    } else {
      // Fallback: just take the first batchSize messages
      selectedMessages = unprocessedMessages.slice(0, batchSize);
    }

    if (unprocessedMessages.length === 0) {
      console.log('✅ No more unprocessed messages found');
      console.log(`🎉 Total messages processed: ${totalProcessed}`);
      break;
    }

    console.log(
      `📊 Batch ${batchNumber}: Found ${unprocessedMessages.length}/${totalUnprocessed} unprocessed messages`
    );

    const messageIds = unprocessedMessages.map(m => m.id);
    const processor = new BatchProcessorV2();

    try {
      const result = await processor.processMessagesToProducts(messageIds);

      if (result.anyProcessed) {
        totalProcessed += unprocessedMessages.length;
        console.log(`✅ Batch ${batchNumber} completed successfully`);
        console.log(`📈 Progress: ${totalProcessed} messages processed so far`);
        batchNumber++;
      } else {
        console.log(`⚠️  Batch ${batchNumber}: No messages were processed`);
        console.log(
          `💡 This batch had no valid product groups, continuing to next batch...`
        );
        batchNumber++;
        // Don't break - continue to next batch
      }
    } catch (error) {
      console.error(`❌ Batch ${batchNumber} failed:`, error);
      process.exit(1);
    }
  }

  console.log(
    '💡 Products are now inactive and will be activated when batches complete'
  );
  console.log('⏳ Run batch-poll-v2.ts to process completed batches');
}

main().catch(console.error);
