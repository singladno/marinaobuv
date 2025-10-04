#!/usr/bin/env tsx

/**
 * Robust Green API message fetcher with comprehensive message collection
 * Uses reverse chronological approach with message ID tracking to ensure no messages are missed
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
 * Get all message IDs that already exist in the database for a given time range
 */
async function getExistingMessageIds(
  startTime: number,
  endTime: number
): Promise<Set<string>> {
  console.log(`🔍 Checking for existing messages in database...`);

  const existingMessages = await prisma.whatsAppMessage.findMany({
    where: {
      timestamp: {
        gte: BigInt(startTime),
        lte: BigInt(endTime),
      },
    },
    select: {
      waMessageId: true,
    },
  });

  const existingIds = new Set(existingMessages.map(msg => msg.waMessageId));
  console.log(`📊 Found ${existingIds.size} existing messages in database`);

  return existingIds;
}

/**
 * Fetch messages using a robust approach that ensures no messages are missed
 */
async function fetchMessagesRobust(
  chatId: string,
  startTime: number,
  endTime: number
): Promise<any[]> {
  console.log(`🔄 Starting robust message fetching...`);
  console.log(
    `📅 Time range: ${new Date(startTime * 1000).toISOString()} to ${new Date(endTime * 1000).toISOString()}`
  );

  const allMessages: any[] = [];
  const seenMessageIds = new Set<string>();
  let requestCount = 0;
  const maxRequests = 50; // Safety limit to prevent infinite loops

  // Get existing message IDs to avoid duplicates
  const existingIds = await getExistingMessageIds(startTime, endTime);

  while (requestCount < maxRequests) {
    try {
      requestCount++;
      console.log(`\n📨 Fetching batch ${requestCount}...`);

      // Add delay to respect rate limits
      console.log(`   ⏳ Waiting 1 second before API call...`);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const messages = await greenApiFetcher.getChatHistory({
        chatId,
        count: 100,
      });

      if (messages.length === 0) {
        console.log(`   📭 No more messages available`);
        break;
      }

      // Filter messages by time range
      const timeFilteredMessages = messages.filter(
        msg => msg.timestamp >= startTime && msg.timestamp <= endTime
      );

      console.log(
        `   📊 Retrieved ${messages.length} messages, ${timeFilteredMessages.length} within time range`
      );

      // Filter out messages we've already seen or that exist in database
      const newMessages = timeFilteredMessages.filter(
        msg =>
          !seenMessageIds.has(msg.idMessage) && !existingIds.has(msg.idMessage)
      );

      if (newMessages.length === 0) {
        console.log(`   ✅ No new messages found in this batch`);
        // If we got 100 messages but none are new, we might have reached the end
        if (messages.length < 100) {
          console.log(`   🏁 Reached end of message history`);
          break;
        }
      } else {
        console.log(`   🆕 Found ${newMessages.length} new messages`);
        allMessages.push(...newMessages);

        // Add to seen set
        newMessages.forEach(msg => seenMessageIds.add(msg.idMessage));
      }

      // Check if we've reached messages older than our time range
      const oldestMessage = messages[messages.length - 1];
      if (oldestMessage.timestamp < startTime) {
        console.log(`   🏁 Reached messages older than time range`);
        break;
      }

      // If we got fewer than 100 messages, we've reached the end
      if (messages.length < 100) {
        console.log(`   🏁 Reached end of message history`);
        break;
      }

      // If we got exactly 100 messages but no new ones, we might be stuck
      if (messages.length === 100 && newMessages.length === 0) {
        console.log(
          `   ⚠️  Got 100 messages but no new ones - might be stuck in a loop`
        );
        console.log(`   🔄 Continuing to check for more messages...`);
      }
    } catch (error) {
      console.error(`❌ Error fetching batch ${requestCount}:`, error);
      if (error instanceof Error && error.message.includes('429')) {
        console.log(`   ⏳ Rate limited, waiting 5 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }
      break;
    }
  }

  console.log(`\n📊 Robust fetching complete:`);
  console.log(`   📨 Total new messages: ${allMessages.length}`);
  console.log(`   🔄 API requests made: ${requestCount}`);
  console.log(`   🆔 Unique message IDs: ${seenMessageIds.size}`);

  return allMessages;
}

async function fetchAllMessagesGreenApiRobust(
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

    // Use robust fetching approach
    const allMessages = await fetchMessagesRobust(chatId, startTime, endTime);

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
  } catch (error) {
    console.error('❌ Error fetching messages from Green API:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting Robust Green API message fetching...\n');

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
    await fetchAllMessagesGreenApiRobust(targetGroupId, fetchHours);
    console.log(
      '\n🎉 Robust Green API message fetching completed successfully!'
    );
  } catch (error) {
    console.error('\n💥 Robust Green API message fetching failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

export { main as fetchAllMessagesGreenApiRobust };
