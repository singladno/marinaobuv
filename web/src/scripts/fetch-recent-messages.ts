#!/usr/bin/env tsx

// Load environment variables from .env.local BEFORE any other imports
import './load-env';

import { prisma } from '../lib/db';
import { env } from '../lib/env';
import { fetchGroupMessages, WhatsAppMessage } from '../lib/message-fetcher';

/**
 * Fetch messages from the last 24 hours
 */
async function fetchRecentMessages(chatId: string): Promise<WhatsAppMessage[]> {
  console.log(`Fetching messages from the last 24 hours for chat: ${chatId}`);

  // Calculate timestamp for 24 hours ago
  const twentyFourHoursAgo = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);

  // Fetch messages from the group
  const messages = await fetchGroupMessages(chatId, 1000); // Fetch more messages to ensure we get recent ones

  // Filter messages from the last 24 hours
  const recentMessages = messages.filter(message => {
    const rawPayload = message as any;
    const messageTimestamp = rawPayload.timestamp || 0;
    return messageTimestamp >= twentyFourHoursAgo;
  });

  console.log(`Found ${recentMessages.length} messages from the last 24 hours`);
  return recentMessages;
}

/**
 * Save message to database with only rawPayload
 */
async function saveMessage(message: WhatsAppMessage): Promise<void> {
  const rawPayload = message as any;

  await prisma.whatsAppMessage.upsert({
    where: { waMessageId: message.id },
    update: {
      rawPayload: message as Record<string, unknown>,
    },
    create: {
      waMessageId: message.id,
      rawPayload: message as Record<string, unknown>,
    },
  });
}

/**
 * Main function to fetch and process recent messages
 */
async function main() {
  try {
    if (!env.TARGET_GROUP_ID) {
      throw new Error('TARGET_GROUP_ID is not set in environment variables');
    }

    console.log('Starting recent message fetch...');
    console.log(`Target group ID: ${env.TARGET_GROUP_ID}`);

    // Fetch recent messages
    const messages = await fetchRecentMessages(env.TARGET_GROUP_ID);

    if (messages.length === 0) {
      console.log('No messages found from the last 24 hours');
      return;
    }

    // Process each message
    let processedCount = 0;
    let errorCount = 0;

    for (const message of messages) {
      try {
        await saveMessage(message);
        processedCount++;

        // Log message details
        const rawPayload = message as any;
        const messageType = rawPayload.type || 'unknown';
        const fromName = rawPayload.from_name || 'Unknown';
        const hasText = rawPayload.text && rawPayload.text.body;
        const hasMedia = rawPayload.image || rawPayload.video || rawPayload.document;

        console.log(`✓ ${messageType} from ${fromName}${hasText ? ' (with text)' : ''}${hasMedia ? ' (with media)' : ''}`);
      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);
        errorCount++;
      }
    }

    console.log('\nProcessing complete!');
    console.log(`Total messages: ${messages.length}`);
    console.log(`Successfully processed: ${processedCount}`);
    console.log(`Errors: ${errorCount}`);
  } catch (error) {
    console.error('Fatal error during message fetching:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
