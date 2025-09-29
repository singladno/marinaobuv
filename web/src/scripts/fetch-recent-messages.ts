#!/usr/bin/env tsx

// Load environment variables from .env.local BEFORE any other imports
import './load-env';

import { prisma } from '../lib/db-node';
import { env } from '../lib/env';
import { fetchGroupMessages, WhatsAppMessage } from '../lib/message-fetcher';

/**
 * Fetch messages from the last N hours (configurable via MESSAGE_FETCH_HOURS)
 */
async function fetchRecentMessages(chatId: string): Promise<WhatsAppMessage[]> {
  const fetchHours = env.MESSAGE_FETCH_HOURS || 24;
  console.log(
    `Fetching messages from the last ${fetchHours} hours for chat: ${chatId}`
  );

  // Calculate timestamp for N hours ago
  const hoursAgo = Math.floor(
    (Date.now() - fetchHours * 60 * 60 * 1000) / 1000
  );

  // Fetch messages from the group
  const messages = await fetchGroupMessages(chatId, 1000); // Fetch more messages to ensure we get recent ones

  // Filter messages from the last N hours and exclude group_invite messages
  const recentMessages = messages.filter(message => {
    const rawPayload = message as any;
    const messageTimestamp = rawPayload.timestamp || 0;
    const messageType = rawPayload.type;

    // Skip group_invite messages
    if (messageType === 'group_invite') {
      return false;
    }

    return messageTimestamp >= hoursAgo;
  });

  console.log(
    `Found ${recentMessages.length} messages from the last ${fetchHours} hours`
  );
  return recentMessages;
}

/**
 * Check if message contains product information
 */
function isProductMessage(message: WhatsAppMessage): boolean {
  const raw = message as any;
  const type = raw.type;

  // Only save messages that could contain product information
  const productTypes = ['text', 'image', 'video'];

  return productTypes.includes(type);
}

/**
 * Save message to database with only rawPayload
 */
async function saveMessage(message: WhatsAppMessage): Promise<void> {
  // Skip non-product messages
  if (!isProductMessage(message)) {
    return;
  }
  const raw = message as any;

  // Extract common fields from WHAPI payload
  const from = raw.from || null;
  const fromName = raw.from_name || null;
  const type = raw.type || null;
  const chatId = raw.chat_id || null;
  const fromMe = !!raw.from_me;
  const timestamp = raw.timestamp ? BigInt(raw.timestamp) : null;

  // Extract text if present
  const text = raw.text?.body ?? null;

  // Extract media if present
  let mediaId: string | null = null;
  let mediaUrl: string | null = null;
  let mediaMimeType: string | null = null;
  let mediaWidth: number | null = null;
  let mediaHeight: number | null = null;
  let mediaSha256: string | null = null;
  let mediaFileSize: number | null = null;

  if (raw.image) {
    mediaId = raw.image.id ?? null;
    mediaUrl = raw.image.link ?? null;
    mediaMimeType = raw.image.mime_type ?? null;
    mediaWidth = raw.image.width ?? null;
    mediaHeight = raw.image.height ?? null;
    mediaSha256 = raw.image.sha256 ?? null;
    mediaFileSize = raw.image.file_size ?? null;
  } else if (raw.video) {
    mediaId = raw.video.id ?? null;
    mediaUrl = raw.video.link ?? null;
    mediaMimeType = raw.video.mime_type ?? null;
    mediaWidth = raw.video.width ?? null;
    mediaHeight = raw.video.height ?? null;
    mediaSha256 = raw.video.sha256 ?? null;
    mediaFileSize = raw.video.file_size ?? null;
  } else if (raw.document) {
    mediaId = raw.document.id ?? null;
    mediaUrl = raw.document.link ?? null;
    mediaMimeType = raw.document.mime_type ?? null;
    mediaFileSize = raw.document.file_size ?? null;
  }

  await prisma.whatsAppMessage.upsert({
    where: { waMessageId: message.id },
    update: {
      from,
      fromName,
      type,
      chatId,
      fromMe,
      timestamp,
      text,
      mediaId,
      mediaUrl,
      mediaMimeType,
      mediaWidth,
      mediaHeight,
      mediaSha256,
      mediaFileSize,
      rawPayload: message as any,
    },
    create: {
      waMessageId: message.id,
      from,
      fromName,
      type,
      chatId,
      fromMe,
      timestamp,
      text,
      mediaId,
      mediaUrl,
      mediaMimeType,
      mediaWidth,
      mediaHeight,
      mediaSha256,
      mediaFileSize,
      rawPayload: message as any,
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
      console.log(
        `No messages found from the last ${env.MESSAGE_FETCH_HOURS || 24} hours`
      );
      return;
    }

    // Process each message
    let processedCount = 0;
    let errorCount = 0;
    let filteredCount = 0;

    for (const message of messages) {
      try {
        if (isProductMessage(message)) {
          await saveMessage(message);
          processedCount++;
        } else {
          filteredCount++;
        }

        // Log message details
        const rawPayload = message as any;
        const messageType = rawPayload.type || 'unknown';
        const fromName = rawPayload.from_name || 'Unknown';
        const hasText = rawPayload.text && rawPayload.text.body;
        const hasMedia =
          rawPayload.image || rawPayload.video || rawPayload.document;

        console.log(
          `✓ ${messageType} from ${fromName}${hasText ? ' (with text)' : ''}${hasMedia ? ' (with media)' : ''}`
        );
      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);
        errorCount++;
      }
    }

    console.log('\nProcessing complete!');
    console.log(`Total messages: ${messages.length}`);
    console.log(`Successfully processed: ${processedCount}`);
    console.log(`Filtered out (non-product): ${filteredCount}`);
    console.log(`Errors: ${errorCount}`);
  } catch (error) {
    console.error('Fatal error during message fetching:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
