#!/usr/bin/env tsx

// Load environment variables from .env.local BEFORE any other imports
import './load-env';

import { processMessageGroupToDraft } from '../lib/draft-processor';
import { groupMessagesWithGPT } from '../lib/gpt-grouping';
import { prisma } from '../lib/db-node';

/**
 * Get messages that need processing (all unprocessed messages)
 */
async function getMessagesForProcessing(limit: number = 50): Promise<string[]> {
  const messages = await prisma.whatsAppMessage.findMany({
    where: {
      fromMe: false,
      draftProduct: null, // strictly messages without a draft
      OR: [
        { text: { not: null } },
        { type: { in: ['image', 'video', 'document'] } },
      ],
    },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return messages.map(msg => msg.id);
}

/**
 * Main processing function
 */
async function main() {
  try {
    console.log('Starting draft product processing with message grouping...');

    // Get messages that need processing (limit to 50 for testing)
    const messageIds = await getMessagesForProcessing(50);
    console.log(`Found ${messageIds.length} messages to process`);

    if (messageIds.length === 0) {
      console.log('No messages to process');
      return;
    }

    // Group messages using GPT analysis
    console.log('Grouping messages using GPT analysis...');
    const messageGroups = await groupMessagesWithGPT(messageIds);

    console.log(`GPT identified ${messageGroups.length} product groups:`);
    messageGroups.forEach((group, index) => {
      console.log(
        `  ${index + 1}. ${group.groupId}: ${group.messageIds.length} messages`
      );
      console.log(`     Context: ${group.productContext}`);
      console.log(`     Confidence: ${group.confidence}`);
    });

    let processed = 0;
    let errors = 0;

    for (const group of messageGroups) {
      try {
        await processMessageGroupToDraft(group.messageIds, group.groupId);
        processed++;
      } catch (e) {
        console.error(
          'Error processing message group to draft',
          group.groupId,
          e
        );
        errors++;
      }
    }

    console.log('Draft product processing complete!');
    console.log(`Processed: ${processed}, Errors: ${errors}`);
  } catch (e) {
    console.error('Failed to process draft products:', e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main();
}
