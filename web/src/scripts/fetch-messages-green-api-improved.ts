#!/usr/bin/env tsx

/**
 * Improved Green API message fetcher with proper pagination and batch processing
 * Fetches ALL messages within the specified time range and saves them in batches
 */

import './load-env';
import { prisma } from '../lib/db-node';
import { env } from '../lib/env';
import { greenApiFetcherImproved } from '../lib/green-api-fetcher-improved';

async function processGreenApiMessageBatch(
  messages: any[]
): Promise<{ processed: number; skipped: number }> {
  let processed = 0;
  let skipped = 0;

  for (const message of messages) {
    try {
      const whatsappMessage =
        greenApiFetcherImproved.convertToWhatsAppMessage(message);
      const pushName = whatsappMessage.from_name || null;
      const text = whatsappMessage.text || null;

      if (
        whatsappMessage.isSystemMessage ||
        whatsappMessage.type === 'group_invite'
      ) {
        console.log(`Skipping system/invite message ${message.idMessage}`);
        skipped++;
        continue;
      }

      console.log(
        `Processing Green API message ${message.idMessage} from ${pushName || 'Unknown'}`
      );

      const existingMessage = await prisma.whatsAppMessage.findUnique({
        where: { waMessageId: message.idMessage },
      });

      if (existingMessage) {
        console.log(`Message ${message.idMessage} already exists, skipping`);
        skipped++;
        continue;
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

      console.log(
        `✅ Successfully saved Green API message ${message.idMessage}`
      );
      processed++;
    } catch (error) {
      console.error(
        `❌ Error processing Green API message ${message.idMessage}:`,
        error
      );
      skipped++;
    }
  }

  return { processed, skipped };
}

async function fetchAllMessagesGreenApi(
  chatId: string,
  hours: number = 7
): Promise<void> {
  console.log(`🔄 Fetching ALL messages from Green API for chat: ${chatId}`);
  console.log(`⏰ Time range: Last ${hours} hours`);

  try {
    const isReady = await greenApiFetcherImproved.isReady();
    if (!isReady) {
      console.log(
        '⚠️  Green API instance not ready, enabling required settings...'
      );
      await greenApiFetcherImproved.enableMessageFetching();
      console.log('⏳ Waiting for settings to take effect...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    const hoursAgo = Math.floor((Date.now() - hours * 60 * 60 * 1000) / 1000);
    console.log(
      `📅 Filtering messages from: ${new Date(hoursAgo * 1000).toISOString()}`
    );

    // Fetch ALL messages within the time range using pagination
    const messages =
      await greenApiFetcherImproved.fetchGroupMessagesWithTimeFilter(
        chatId,
        hoursAgo,
        10000 // Allow up to 10,000 messages
      );

    console.log(`📨 Fetched ${messages.length} total messages from Green API`);
    console.log(
      `⏰ Found ${messages.length} messages from the last ${hours} hours`
    );

    if (messages.length === 0) {
      console.log('No messages found in the specified time range');
      return;
    }

    // Process messages in batches of 100 for better performance
    const batchSize = 100;
    const batches = [];
    for (let i = 0; i < messages.length; i += batchSize) {
      batches.push(messages.slice(i, i + batchSize));
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

      const { processed, skipped } = await processGreenApiMessageBatch(batch);

      totalProcessed += processed;
      totalSkipped += skipped;

      console.log(
        `✅ Batch ${i + 1} complete: ${processed} processed, ${skipped} skipped`
      );

      // Add a small delay between batches to avoid overwhelming the database
      if (i < batches.length - 1) {
        console.log('⏳ Waiting 500ms before next batch...');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`\n🎉 Processing complete:`);
    console.log(`   📨 Total messages: ${messages.length}`);
    console.log(`   ✅ Processed: ${totalProcessed}`);
    console.log(`   ⏭️  Skipped: ${totalSkipped}`);
    console.log(`   📦 Batches: ${batches.length}`);
  } catch (error) {
    console.error('❌ Error fetching messages from Green API:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting Improved Green API message fetching...\n');

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
      '\n🎉 Improved Green API message fetching completed successfully!'
    );
  } catch (error) {
    console.error('\n💥 Improved Green API message fetching failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

export { main as fetchAllMessagesGreenApi };
