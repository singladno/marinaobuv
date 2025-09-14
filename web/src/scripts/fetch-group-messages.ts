#!/usr/bin/env tsx

// Load environment variables from .env.local BEFORE any other imports
import './load-env';

import { prisma } from '../lib/db';
import { env } from '../lib/env';
import { fetchGroupMessages, WhatsAppMessage } from '../lib/message-fetcher';
import {
  processMediaUpload,
  saveWhatsAppMessage,
} from '../lib/message-processor-extended';
import { processProviderFromMessage } from '../lib/provider-utils';

/**
 * Process and save a single message
 */
async function processMessage(message: WhatsAppMessage): Promise<void> {
  try {
    // Extract data from WHAPI response structure
    const rawPayload = message as unknown as Record<string, unknown>;
    const pushName = (rawPayload.from_name as string) || null;

    // Skip group_invite messages
    if (rawPayload.type === 'group_invite') {
      console.log(`Skipping group_invite message ${message.id}`);
      return;
    }

    console.log(
      `Processing message ${message.id} from ${pushName || 'Unknown'}`
    );

    // Extract text content from WHAPI response
    const text = extractTextFromMessage(rawPayload);

    // Process provider
    const providerId = await processProviderFromMessage({
      pushName: pushName,
    });

    // Handle media upload if present
    const { mediaS3Key, mediaUrl } = await processMediaUpload(message);

    // Save message to database
    await saveWhatsAppMessage(message, text, mediaS3Key, mediaUrl, providerId);

    console.log(`Successfully processed message ${message.id}`);
  } catch (error) {
    console.error(`Error processing message ${message.id}:`, error);
  }
}

/**
 * Extract text content from message payload
 */
function extractTextFromMessage(
  rawPayload: Record<string, unknown>
): string | null {
  if (
    rawPayload.text &&
    typeof rawPayload.text === 'object' &&
    rawPayload.text !== null
  ) {
    const textObj = rawPayload.text as Record<string, unknown>;
    if (textObj.body && typeof textObj.body === 'string') {
      return textObj.body;
    }
  } else if (rawPayload.text && typeof rawPayload.text === 'string') {
    return rawPayload.text;
  }
  return null;
}

/**
 * Check which messages already exist in the database
 */
async function getExistingMessageIds(
  messageIds: string[]
): Promise<Set<string>> {
  const existingMessages = await prisma.whatsAppMessage.findMany({
    where: {
      waMessageId: {
        in: messageIds,
      },
    },
    select: {
      waMessageId: true,
    },
  });

  return new Set(
    existingMessages.map((msg: { waMessageId: string }) => msg.waMessageId)
  );
}

/**
 * Fetch messages from the configured time range
 */
async function fetchRecentMessages(chatId: string): Promise<WhatsAppMessage[]> {
  console.log(
    `Fetching messages from the last ${env.MESSAGE_FETCH_HOURS} hours for chat: ${chatId}`
  );

  // Fetch messages from the group (message-fetcher now handles time filtering)
  const messages = await fetchGroupMessages(chatId, 10000); // High limit to get all recent messages

  console.log(
    `Found ${messages.length} messages from the last ${env.MESSAGE_FETCH_HOURS} hours`
  );

  // Check which messages already exist in the database
  const messageIds = messages.map(msg => msg.id);
  const existingMessageIds = await getExistingMessageIds(messageIds);

  // Filter out messages that already exist
  const newMessages = messages.filter(
    message => !existingMessageIds.has(message.id)
  );

  console.log(`Found ${existingMessageIds.size} messages already in database`);
  console.log(`Processing ${newMessages.length} new messages`);

  return newMessages;
}

/**
 * Main function to fetch and process messages
 */
async function main() {
  try {
    if (!env.TARGET_GROUP_ID) {
      throw new Error('TARGET_GROUP_ID is not set in environment variables');
    }

    console.log('Starting message fetch and processing...');
    console.log(`Target group ID: ${env.TARGET_GROUP_ID}`);

    // Fetch messages from the configured time range (excluding duplicates)
    const messages = await fetchRecentMessages(env.TARGET_GROUP_ID);

    if (messages.length === 0) {
      console.log(
        `No new messages to process from the last ${env.MESSAGE_FETCH_HOURS} hours`
      );
      return;
    }

    // Process each message
    let processedCount = 0;
    let errorCount = 0;

    console.log(`\nProcessing ${messages.length} new messages...`);

    for (const message of messages) {
      try {
        await processMessage(message);
        processedCount++;
      } catch (error) {
        console.error(`Failed to process message ${message.id}:`, error);
        errorCount++;
      }
    }

    console.log(`\nProcessing complete!`);
    console.log(`New messages processed: ${processedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(
      `Success rate: ${processedCount > 0 ? Math.round((processedCount / messages.length) * 100) : 0}%`
    );
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main();
}
