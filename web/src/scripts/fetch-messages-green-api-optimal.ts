#!/usr/bin/env tsx

/**
 * Optimal Green API message fetcher
 * Acknowledges Green API limitations and uses the most efficient approach
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
 * Get message count in database for a given time range
 */
async function getMessageCountInDatabase(
  startTime: number,
  endTime: number
): Promise<number> {
  const count = await prisma.whatsAppMessage.count({
    where: {
      timestamp: {
        gte: BigInt(startTime),
        lte: BigInt(endTime),
      },
    },
  });
  return count;
}

/**
 * Optimal message fetching strategy
 * Since Green API only returns 100 most recent messages, we:
 * 1. Check if we already have recent messages
 * 2. Fetch only if we need to update
 * 3. Use time-based windows for better coverage
 */
async function fetchMessagesOptimal(
  chatId: string,
  startTime: number,
  endTime: number,
  hours: number
): Promise<any[]> {
  console.log(`🔄 Starting optimal message fetching...`);
  console.log(
    `📅 Time range: ${new Date(startTime * 1000).toISOString()} to ${new Date(endTime * 1000).toISOString()}`
  );

  // Check how many messages we already have in this time range
  const existingCount = await getMessageCountInDatabase(startTime, endTime);
  console.log(`📊 Found ${existingCount} existing messages in database`);

  // If we already have a good number of messages, we might not need to fetch
  if (existingCount >= 50) {
    console.log(
      `✅ Already have ${existingCount} messages in time range - likely up to date`
    );
    console.log(
      `💡 Green API limitation: Can only fetch 100 most recent messages`
    );
    console.log(
      `💡 For complete historical data, consider using webhooks for real-time capture`
    );
    return [];
  }

  const allMessages: any[] = [];
  const seenMessageIds = new Set<string>();

  // Strategy: Use smaller time windows to maximize coverage
  const windowSizeHours = Math.max(1, Math.floor(hours / 3)); // Use 3 windows max
  console.log(`📅 Using ${windowSizeHours}-hour windows for better coverage`);

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

    console.log(`\n📅 Fetching messages for window: ${windowName}`);

    try {
      // Add delay to respect rate limits
      console.log(`   ⏳ Waiting 1 second before API call...`);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const messages = await greenApiFetcher.getChatHistory({
        chatId,
        count: 100,
      });

      if (messages.length === 0) {
        console.log(`   📭 No messages found in ${windowName}`);
        continue;
      }

      // Filter messages by time window
      const windowMessages = messages.filter(
        msg => msg.timestamp >= currentTime && msg.timestamp <= windowEndTime
      );

      console.log(
        `   📊 Retrieved ${messages.length} messages, ${windowMessages.length} within window`
      );

      // Filter out messages we've already seen
      const newMessages = windowMessages.filter(
        msg => !seenMessageIds.has(msg.idMessage)
      );

      if (newMessages.length > 0) {
        console.log(`   🆕 Found ${newMessages.length} new messages in window`);
        allMessages.push(...newMessages);
        newMessages.forEach(msg => seenMessageIds.add(msg.idMessage));
      } else {
        console.log(`   ✅ No new messages in this window`);
      }

      // If we got 100 messages in this window, there might be more
      if (messages.length === 100) {
        console.log(
          `   ⚠️  Got 100 messages - there might be more, but Green API doesn't support pagination`
        );
      }
    } catch (error) {
      console.error(`❌ Error fetching messages for ${windowName}:`, error);
      if (error instanceof Error && error.message.includes('429')) {
        console.log(`   ⏳ Rate limited, waiting 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  console.log(`\n📊 Optimal fetching complete:`);
  console.log(`   📨 Total new messages: ${allMessages.length}`);
  console.log(`   🆔 Unique message IDs: ${seenMessageIds.size}`);
  console.log(`   📊 Existing in DB: ${existingCount}`);

  return allMessages;
}

async function fetchAllMessagesGreenApiOptimal(
  chatId: string,
  hours: number = 7
): Promise<void> {
  console.log(`🔄 Fetching messages from Green API for chat: ${chatId}`);
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

    // Use optimal fetching strategy
    const allMessages = await fetchMessagesOptimal(
      chatId,
      startTime,
      endTime,
      hours
    );

    if (allMessages.length === 0) {
      console.log('No new messages found in the specified time range');
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

    // Provide guidance about Green API limitations
    console.log(`\n💡 Green API Limitations:`);
    console.log(`   • Can only fetch 100 most recent messages per request`);
    console.log(`   • No pagination or offset support`);
    console.log(`   • For complete historical data, consider using webhooks`);
    console.log(
      `   • Current approach maximizes coverage within these limitations`
    );
  } catch (error) {
    console.error('❌ Error fetching messages from Green API:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting Optimal Green API message fetching...\n');

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
    await fetchAllMessagesGreenApiOptimal(targetGroupId, fetchHours);
    console.log(
      '\n🎉 Optimal Green API message fetching completed successfully!'
    );
  } catch (error) {
    console.error('\n💥 Optimal Green API message fetching failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

export { main as fetchAllMessagesGreenApiOptimal };
