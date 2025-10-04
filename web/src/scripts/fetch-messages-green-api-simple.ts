#!/usr/bin/env tsx

/**
 * Simple Green API message fetcher - fetches only the most recent 100 messages
 * This is the correct approach since Green API doesn't support pagination
 */

import './load-env';
import { prisma } from '../lib/db-node';
import { env } from '../lib/env';
import { greenApiFetcher } from '../lib/green-api-fetcher';

async function processGreenApiMessage(message: any): Promise<void> {
  try {
    const whatsappMessage = greenApiFetcher.convertToWhatsAppMessage(message);
    const pushName = whatsappMessage.from_name || null;
    const text = whatsappMessage.text || null;

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

    const existingMessage = await prisma.whatsAppMessage.findUnique({
      where: { waMessageId: message.idMessage },
    });

    if (existingMessage) {
      console.log(`Message ${message.idMessage} already exists, skipping`);
      return;
    }

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
        rawPayload: message as any,
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

async function fetchRecentMessagesGreenApi(
  chatId: string,
  hours: number = 1
): Promise<void> {
  console.log(`🔄 Fetching recent messages from Green API for chat: ${chatId}`);
  console.log(`⏰ Time range: Last ${hours} hours`);

  try {
    const isReady = await greenApiFetcher.isReady();
    if (!isReady) {
      console.log(
        '⚠️  Green API instance not ready, enabling required settings...'
      );
      await greenApiFetcher.enableMessageFetching();
      console.log('⏳ Waiting for settings to take effect...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    const hoursAgo = Math.floor((Date.now() - hours * 60 * 60 * 1000) / 1000);
    console.log(
      `📅 Filtering messages from: ${new Date(hoursAgo * 1000).toISOString()}`
    );

    // Fetch messages with time-based filtering (single request)
    const messages = await greenApiFetcher.fetchGroupMessagesWithTimeFilter(
      chatId,
      hoursAgo,
      100 // Green API max per request
    );

    console.log(`📨 Fetched ${messages.length} total messages from Green API`);
    console.log(
      `⏰ Found ${messages.length} messages from the last ${hours} hours`
    );

    if (messages.length === 0) {
      console.log('No messages found in the specified time range');
      return;
    }

    // Process each message
    let processedCount = 0;
    let skippedCount = 0;

    for (const message of messages) {
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
    console.log(`   ✅ Processed: ${processedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
  } catch (error) {
    console.error('❌ Error fetching messages from Green API:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting Simple Green API message fetching...\n');

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
  const fetchHours = env.MESSAGE_FETCH_HOURS || 1; // Default to 1 hour

  console.log(`🎯 Target group: ${targetGroupId}`);
  console.log(`⏰ Fetch hours: ${fetchHours}`);
  console.log(`🔧 Green API instance: ${env.GREEN_API_INSTANCE_ID}`);

  try {
    await fetchRecentMessagesGreenApi(targetGroupId, fetchHours);
    console.log(
      '\n🎉 Simple Green API message fetching completed successfully!'
    );
  } catch (error) {
    console.error('\n💥 Simple Green API message fetching failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

export { main as fetchMessagesGreenApiSimple };
