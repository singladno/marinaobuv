#!/usr/bin/env tsx

/**
 * Fetch messages using Green API
 * This script demonstrates how to use Green API as an alternative to WHAPI
 * Usage: npx tsx src/scripts/fetch-messages-green-api.ts
 */

// Load environment variables from .env.local BEFORE any other imports
import './load-env';

import { greenApiFetcher } from '../lib/green-api-fetcher';
import { env } from '../lib/env';
import { prisma } from '../lib/db-node';

/**
 * Process and save a Green API message to database
 */
async function processGreenApiMessage(message: any): Promise<void> {
  try {
    // Convert Green API message to WhatsApp format
    const whatsappMessage = greenApiFetcher.convertToWhatsAppMessage(message);

    // Extract data from message
    const pushName = whatsappMessage.from_name || null;
    const text = whatsappMessage.text || null;

    // Skip system messages and group invites
    if (
      whatsappMessage.isSystemMessage ||
      whatsappMessage.type === 'group_invite'
    ) {
      console.log(`Skipping system/invite message ${message.idMessage}`);
      return;
    }

    console.log(
      `Processing Green API message ${message.idMessage} from ${pushName || 'Unknown'}`
    );

    // Check if message already exists
    const existingMessage = await prisma.whatsAppMessage.findUnique({
      where: { waMessageId: message.idMessage },
    });

    if (existingMessage) {
      console.log(`Message ${message.idMessage} already exists, skipping`);
      return;
    }

    // Save message to database (using existing schema)
    await prisma.whatsAppMessage.create({
      data: {
        waMessageId: message.idMessage,
        chatId: message.chatId,
        from: message.senderId || null,
        fromName: pushName,
        text: text,
        type: message.typeMessage,
        timestamp: BigInt(message.timestamp),
        fromMe: message.isFromMe || false,
        mediaMimeType: message.mimeType || null,
        mediaFileSize: message.fileSize || null,
        rawPayload: message as any, // Store the full Green API message as raw payload
      },
    });

    console.log(`✅ Successfully saved Green API message ${message.idMessage}`);
  } catch (error) {
    console.error(
      `❌ Error processing Green API message ${message.idMessage}:`,
      error
    );
  }
}

/**
 * Fetch recent messages using Green API
 */
async function fetchRecentMessagesGreenApi(
  chatId: string,
  hours: number = 24
): Promise<void> {
  console.log(`🔄 Fetching messages from Green API for chat: ${chatId}`);
  console.log(`⏰ Time range: Last ${hours} hours`);

  try {
    // Check if instance is ready
    const isReady = await greenApiFetcher.isReady();
    if (!isReady) {
      console.log(
        '⚠️  Green API instance not ready, enabling required settings...'
      );
      await greenApiFetcher.enableMessageFetching();

      // Wait for settings to take effect
      console.log('⏳ Waiting for settings to take effect...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    // Calculate timestamp for filtering
    const hoursAgo = Math.floor((Date.now() - hours * 60 * 60 * 1000) / 1000);
    console.log(
      `📅 Filtering messages from: ${new Date(hoursAgo * 1000).toISOString()}`
    );

    // Fetch messages with time-based filtering
    // Since Green API only allows 100 messages per request, we fetch once and filter by time
    const messages = await greenApiFetcher.fetchGroupMessagesWithTimeFilter(
      chatId,
      hoursAgo,
      100 // Green API max per request
    );

    console.log(`📨 Fetched ${messages.length} total messages from Green API`);
    console.log(
      `⏰ Found ${messages.length} messages from the last ${hours} hours`
    );

    const recentMessages = messages; // Messages are already filtered by time

    // Process each message
    let processedCount = 0;
    let skippedCount = 0;

    for (const message of recentMessages) {
      try {
        await processGreenApiMessage(message);
        processedCount++;
      } catch (error) {
        console.error(`Error processing message ${message.idMessage}:`, error);
        skippedCount++;
      }
    }

    console.log(`✅ Processing complete:`);
    console.log(`   📨 Total messages: ${messages.length}`);
    console.log(`   ⏰ Recent messages: ${recentMessages.length}`);
    console.log(`   ✅ Processed: ${processedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
  } catch (error) {
    console.error('❌ Error fetching messages from Green API:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting Green API message fetching...\n');

  // Check environment variables
  if (!env.GREEN_API_INSTANCE_ID || !env.GREEN_API_TOKEN) {
    console.error('❌ Green API credentials not configured!');
    console.log('Please set the following environment variables:');
    console.log('  GREEN_API_INSTANCE_ID=your_instance_id');
    console.log('  GREEN_API_TOKEN=your_token');
    process.exit(1);
  }

  if (!env.TARGET_GROUP_ID) {
    console.error('❌ TARGET_GROUP_ID not configured!');
    console.log(
      'Please set TARGET_GROUP_ID environment variable with your group chat ID'
    );
    process.exit(1);
  }

  const targetGroupId = env.TARGET_GROUP_ID;
  const fetchHours = 1; // Reduced to 1 hour for very active groups (webhooks handle real-time saving)

  console.log(`🎯 Target group: ${targetGroupId}`);
  console.log(`⏰ Fetch hours: ${fetchHours}`);
  console.log(`🔧 Green API instance: ${env.GREEN_API_INSTANCE_ID}`);

  try {
    await fetchRecentMessagesGreenApi(targetGroupId, fetchHours);
    console.log('\n🎉 Green API message fetching completed successfully!');
  } catch (error) {
    console.error('\n💥 Green API message fetching failed:', error);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

export { main as fetchMessagesGreenApi };
