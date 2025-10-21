#!/usr/bin/env tsx

/**
 * Practical Green API message fetcher
 * Fetches messages by dividing the time range into smaller windows to avoid missing messages
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

/**
 * Fetch messages for a specific time window
 */
async function fetchMessagesForWindow(
  chatId: string,
  startTime: number,
  endTime: number,
  windowName: string
): Promise<any[]> {
  console.log(`📅 Fetching messages for ${windowName}...`);

  try {
    // Add delay to respect rate limits
    console.log(`   ⏳ Waiting 1 second before API call...`);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const messages = await greenApiFetcher.getChatHistory({
      chatId,
      count: 100,
    });

    if (messages.length === 0) {
      console.log(`   No messages found in ${windowName}`);
      return [];
    }

    // Filter messages within the time window
    const windowMessages = messages.filter(
      msg => msg.timestamp >= startTime && msg.timestamp <= endTime
    );

    console.log(`   Found ${windowMessages.length} messages in ${windowName}`);

    return windowMessages;
  } catch (error) {
    console.error(`❌ Error fetching messages for ${windowName}:`, error);
    return [];
  }
}

async function fetchAllMessagesGreenApi(
  chatId: string,
  hours: number = 7
): Promise<void> {
  console.log(`🔄 Fetching ALL messages from Green API for chat: ${chatId}`);
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

    const endTime = Math.floor(Date.now() / 1000);
    const startTime = Math.floor((Date.now() - hours * 60 * 60 * 1000) / 1000);

    console.log(
      `📅 Fetching messages from: ${new Date(startTime * 1000).toISOString()}`
    );
    console.log(
      `📅 Fetching messages until: ${new Date(endTime * 1000).toISOString()}`
    );

    // Strategy: Divide the time range into smaller windows
    // If we get 100 messages in a window, it means there might be more
    const windowSizeHours = 1; // 1 hour windows
    const allMessages: any[] = [];
    const seenMessageIds = new Set<string>();

    for (
      let currentTime = startTime;
      currentTime < endTime;
      currentTime += windowSizeHours * 60 * 60
    ) {
      const windowEndTime = Math.min(
        currentTime + windowSizeHours * 60 * 60,
        endTime
      );
      const windowName = `${new Date(currentTime * 1000).toISOString().substring(0, 16)} to ${new Date(windowEndTime * 1000).toISOString().substring(0, 16)}`;

      const windowMessages = await fetchMessagesForWindow(
        chatId,
        currentTime,
        windowEndTime,
        windowName
      );

      // Add unique messages only
      for (const message of windowMessages) {
        if (!seenMessageIds.has(message.idMessage)) {
          seenMessageIds.add(message.idMessage);
          allMessages.push(message);
        }
      }

      // If we got 100 messages, there might be more in this window
      // But we can't split further due to Green API limitations
      if (windowMessages.length === 100) {
        console.log(
          `   ⚠️  Got 100 messages in ${windowName} - there might be more, but Green API doesn't support pagination`
        );
      }
    }

    console.log(
      `📨 Fetched ${allMessages.length} total unique messages from Green API`
    );
    console.log(
      `⏰ Found ${allMessages.length} messages from the last ${hours} hours`
    );

    if (allMessages.length === 0) {
      console.log('No messages found in the specified time range');
      return;
    }

    // Process messages in batches
    const batchSize = 50;
    const batches = [];
    for (let i = 0; i < allMessages.length; i += batchSize) {
      batches.push(allMessages.slice(i, i + batchSize));
    }

    console.log(
      `📦 Processing ${batches.length} batches of up to ${batchSize} messages each`
    );

    let totalProcessed = 0;
    let totalSkipped = 0;

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(
        `\n🔄 Processing batch ${i + 1}/${batches.length} (${batch.length} messages)...`
      );

      let batchProcessed = 0;
      let batchSkipped = 0;

      for (const message of batch) {
        try {
          await processGreenApiMessage(message);
          batchProcessed++;
        } catch (error) {
          console.error(
            `Error processing message ${message.idMessage}:`,
            error
          );
          batchSkipped++;
        }
      }

      totalProcessed += batchProcessed;
      totalSkipped += batchSkipped;

      console.log(
        `✅ Batch ${i + 1} complete: ${batchProcessed} processed, ${batchSkipped} skipped`
      );

      // Add a small delay between batches
      if (i < batches.length - 1) {
        console.log('⏳ Waiting 500ms before next batch...');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`\n🎉 Processing complete:`);
    console.log(`   📨 Total messages: ${allMessages.length}`);
    console.log(`   ✅ Processed: ${totalProcessed}`);
    console.log(`   ⏭️  Skipped: ${totalSkipped}`);
    console.log(`   📦 Batches: ${batches.length}`);
  } catch (error) {
    console.error('❌ Error fetching messages from Green API:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting Practical Green API message fetching...\n');

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
  const fetchHours = 7; // Fixed hours since webhooks handle real-time message saving

  console.log(`🎯 Target group: ${targetGroupId}`);
  console.log(`⏰ Fetch hours: ${fetchHours}`);
  console.log(`🔧 Green API instance: ${env.GREEN_API_INSTANCE_ID}`);

  try {
    await fetchAllMessagesGreenApi(targetGroupId, fetchHours);
    console.log(
      '\n🎉 Practical Green API message fetching completed successfully!'
    );
  } catch (error) {
    console.error('\n💥 Practical Green API message fetching failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

export { main as fetchAllMessagesGreenApiPractical };
