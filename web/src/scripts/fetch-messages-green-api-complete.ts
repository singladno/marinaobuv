#!/usr/bin/env tsx

/**
 * Complete Green API message fetcher with time-based pagination
 * Fetches ALL messages within the specified time range by dividing it into smaller intervals
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
 * Fetch messages for a specific time interval
 */
async function fetchMessagesForInterval(
  chatId: string,
  startTime: number,
  endTime: number,
  intervalName: string
): Promise<any[]> {
  console.log(`📅 Fetching messages for ${intervalName}...`);

  try {
    // Add delay to respect rate limits
    console.log(`   ⏳ Waiting 1 second before API call...`);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const messages = await greenApiFetcher.getChatHistory({
      chatId,
      count: 100,
    });

    if (messages.length === 0) {
      console.log(`   No messages found in ${intervalName}`);
      return [];
    }

    // Filter messages within the time interval
    const intervalMessages = messages.filter(
      msg => msg.timestamp >= startTime && msg.timestamp <= endTime
    );

    console.log(
      `   Found ${intervalMessages.length} messages in ${intervalName}`
    );

    // If we got exactly 100 messages, there might be more in this interval
    if (messages.length === 100) {
      console.log(
        `   ⚠️  Got 100 messages - there might be more in this interval`
      );
      console.log(
        `   📊 Time range: ${new Date(startTime * 1000).toISOString()} to ${new Date(endTime * 1000).toISOString()}`
      );

      // Check if the oldest message is within our interval
      const oldestMessage = messages[messages.length - 1];
      if (oldestMessage.timestamp >= startTime) {
        console.log(`   🔄 This interval needs to be split further`);
        return []; // Signal that this interval needs to be split
      }
    }

    return intervalMessages;
  } catch (error) {
    console.error(`❌ Error fetching messages for ${intervalName}:`, error);
    return [];
  }
}

/**
 * Recursively fetch messages by splitting time intervals when we hit the 100-message limit
 */
async function fetchMessagesRecursive(
  chatId: string,
  startTime: number,
  endTime: number,
  intervalName: string,
  minIntervalMinutes: number = 5
): Promise<any[]> {
  const intervalMinutes = (endTime - startTime) / 60;

  // If interval is too small, stop splitting
  if (intervalMinutes < minIntervalMinutes) {
    console.log(
      `   ⏹️  Interval too small (${intervalMinutes.toFixed(1)} min), stopping recursion`
    );
    return [];
  }

  const messages = await fetchMessagesForInterval(
    chatId,
    startTime,
    endTime,
    intervalName
  );

  if (messages === null) {
    // Need to split this interval
    const midTime = Math.floor((startTime + endTime) / 2);
    const firstHalf = `${intervalName}-1`;
    const secondHalf = `${intervalName}-2`;

    console.log(`   🔄 Splitting ${intervalName} into two halves`);

    // Process sequentially to avoid rate limits
    const firstMessages = await fetchMessagesRecursive(
      chatId,
      startTime,
      midTime,
      firstHalf,
      minIntervalMinutes
    );

    // Add delay between requests to respect rate limits
    console.log(`   ⏳ Waiting 2 seconds before next request...`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const secondMessages = await fetchMessagesRecursive(
      chatId,
      midTime,
      endTime,
      secondHalf,
      minIntervalMinutes
    );

    return [...firstMessages, ...secondMessages];
  }

  return messages;
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

    // Start with the full time range
    const allMessages = await fetchMessagesRecursive(
      chatId,
      startTime,
      endTime,
      `Full ${hours}h range`
    );

    console.log(
      `📨 Fetched ${allMessages.length} total messages from Green API`
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
  console.log('🚀 Starting Complete Green API message fetching...\n');

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
  const fetchHours = env.MESSAGE_FETCH_HOURS || 7;

  console.log(`🎯 Target group: ${targetGroupId}`);
  console.log(`⏰ Fetch hours: ${fetchHours}`);
  console.log(`🔧 Green API instance: ${env.GREEN_API_INSTANCE_ID}`);

  try {
    await fetchAllMessagesGreenApi(targetGroupId, fetchHours);
    console.log(
      '\n🎉 Complete Green API message fetching completed successfully!'
    );
  } catch (error) {
    console.error('\n💥 Complete Green API message fetching failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

export { main as fetchAllMessagesGreenApiComplete };
