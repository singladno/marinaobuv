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
    // Get unprocessed messages in strict chronological order
    const batchSize = parseInt(process.env.PROCESSING_BATCH_SIZE || '100');

    // Get messages in chronological order - no filtering, no mixing
    const unprocessedMessages = await prisma.whatsAppMessage.findMany({
      where: {
        processed: false,
        type: { in: ['textMessage', 'imageMessage'] },
        OR: [{ text: { not: null } }, { mediaUrl: { not: null } }],
      },
      orderBy: { createdAt: 'asc' },
      take: batchSize, // Get exactly batchSize messages
    });

    if (unprocessedMessages.length === 0) {
      console.log('✅ No more unprocessed messages found');
      console.log(`🎉 Total messages processed: ${totalProcessed}`);
      break;
    }

    // Check if the last message in batch is from the same user as the next unprocessed message
    // If so, include additional messages from the same user to complete the product sequence
    let selectedMessages = [...unprocessedMessages];

    if (selectedMessages.length === batchSize) {
      const lastMessage = selectedMessages[selectedMessages.length - 1];
      const nextMessage = await prisma.whatsAppMessage.findFirst({
        where: {
          processed: false,
          type: { in: ['textMessage', 'imageMessage'] },
          OR: [{ text: { not: null } }, { mediaUrl: { not: null } }],
          createdAt: { gt: lastMessage.createdAt },
        },
        orderBy: { createdAt: 'asc' },
      });

      // If next message is from the same user, include it and any following messages from same user
      if (nextMessage && nextMessage.from === lastMessage.from) {
        const additionalMessages = await prisma.whatsAppMessage.findMany({
          where: {
            processed: false,
            type: { in: ['textMessage', 'imageMessage'] },
            OR: [{ text: { not: null } }, { mediaUrl: { not: null } }],
            from: lastMessage.from,
            createdAt: { gte: nextMessage.createdAt },
          },
          orderBy: { createdAt: 'asc' },
          take: 50, // Limit additional messages to prevent huge batches
        });

        selectedMessages = [...selectedMessages, ...additionalMessages];
        console.log(
          `📊 Extended batch to ${selectedMessages.length} messages to complete product sequence from ${lastMessage.from}`
        );
      }
    }

    if (unprocessedMessages.length === 0) {
      console.log('✅ No more unprocessed messages found');
      console.log(`🎉 Total messages processed: ${totalProcessed}`);
      break;
    }

    console.log(
      `📊 Batch ${batchNumber}: Found ${selectedMessages.length}/${totalUnprocessed} unprocessed messages`
    );

    const messageIds = selectedMessages.map(m => m.id);
    const processor = new BatchProcessorV2();

    try {
      const result = await processor.processMessagesToProducts(messageIds);

      if (result.anyProcessed) {
        totalProcessed += selectedMessages.length;
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
