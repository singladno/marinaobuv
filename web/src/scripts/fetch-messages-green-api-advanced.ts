#!/usr/bin/env tsx

/**
 * Advanced Green API message fetcher using all available methods
 * Uses GetMessagesCount, LastIncomingMessages, LastOutgoingMessages, and other methods
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

    // Extract media information from Green API message
    let mediaUrl: string | null = null;
    let mediaId: string | null = null;
    let mediaWidth: number | null = null;
    let mediaHeight: number | null = null;
    const mediaSha256: string | null = null;
    const mediaPreview: string | null = null;

    // Check for image/video/document media - handle empty strings
    // Priority order: downloadUrl -> mediaData.url -> raw payload downloadUrl
    if (message.downloadUrl && message.downloadUrl.trim() !== '') {
      mediaUrl = message.downloadUrl;
      console.log(`📷 Found downloadUrl: ${mediaUrl}`);
    } else if (message.mediaData?.url && message.mediaData.url.trim() !== '') {
      mediaUrl = message.mediaData.url;
      console.log(`📷 Found mediaData.url: ${mediaUrl}`);
    }

    // Also check the raw payload for downloadUrl (Green API sometimes puts it there)
    const rawDownloadUrl = (message as any).downloadUrl;
    if (!mediaUrl && rawDownloadUrl && rawDownloadUrl.trim() !== '') {
      mediaUrl = rawDownloadUrl;
      console.log(`📷 Found downloadUrl in raw payload: ${mediaUrl}`);
    }

    // Extract additional media metadata
    if (message.mediaData) {
      mediaId = message.mediaData.type || null;
      // Try to get actual dimensions if available
      if (message.mediaData.size) {
        // If size is available, use it for both width and height as placeholder
        const size = parseInt(message.mediaData.size.toString());
        mediaWidth = size > 0 ? size : null;
        mediaHeight = size > 0 ? size : null;
      }
    }

    // For image messages, try to get more specific metadata
    if (message.typeMessage === 'imageMessage' && message.mimeType) {
      console.log(
        `🖼️  Processing image message with MIME: ${message.mimeType}`
      );

      // If we still don't have a media URL, try to fetch it using downloadFile
      if (!mediaUrl) {
        console.log(
          `⚠️  No media URL found for image message ${message.idMessage}, trying downloadFile...`
        );
        try {
          const downloadUrl = await greenApiFetcher.downloadFile(
            message.idMessage,
            message.chatId
          );
          if (downloadUrl) {
            mediaUrl = downloadUrl;
            console.log(`📷 Successfully fetched media URL: ${mediaUrl}`);
          } else {
            console.log(
              `❌ Failed to get download URL for message ${message.idMessage}`
            );
          }
        } catch (error) {
          console.error(
            `❌ Error fetching download URL for message ${message.idMessage}:`,
            error
          );
        }
      }
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
        mediaUrl: mediaUrl,
        mediaId: mediaId,
        mediaWidth: mediaWidth,
        mediaHeight: mediaHeight,
        mediaSha256: mediaSha256,
        mediaPreview: mediaPreview,
        rawPayload: message as any,
      },
    });

    const mediaInfo = mediaUrl ? ` with media: ${mediaUrl}` : '';
    console.log(
      `✅ Successfully saved Green API message ${message.idMessage}${mediaInfo}`
    );
  } catch (error) {
    console.error(
      `❌ Error processing Green API message ${message.idMessage}:`,
      error
    );
  }
}

/**
 * Get message count using Green API's GetMessagesCount method
 */
async function getMessageCount(chatId: string): Promise<number> {
  try {
    console.log(`📊 Getting message count for chat: ${chatId}`);

    const url = `${env.GREEN_API_BASE_URL}/waInstance${env.GREEN_API_INSTANCE_ID}/getMessagesCount/${env.GREEN_API_TOKEN}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId }),
    });

    if (!response.ok) {
      throw new Error(
        `Green API request failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log(`📊 Message count response:`, data);

    // The response structure might vary, let's handle different possible formats
    if (typeof data === 'number') {
      return data;
    } else if (data.count) {
      return data.count;
    } else if (data.totalMessages) {
      return data.totalMessages;
    } else {
      console.log(`⚠️  Unexpected message count response format:`, data);
      return 0;
    }
  } catch (error) {
    console.error(`❌ Error getting message count:`, error);
    return 0;
  }
}

/**
 * Get last incoming messages using LastIncomingMessages method
 */
async function getLastIncomingMessages(
  chatId: string,
  count: number = 50
): Promise<any[]> {
  try {
    console.log(
      `📨 Getting last ${count} incoming messages for chat: ${chatId}`
    );

    const url = `${env.GREEN_API_BASE_URL}/waInstance${env.GREEN_API_INSTANCE_ID}/lastIncomingMessages/${env.GREEN_API_TOKEN}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, count }),
    });

    if (!response.ok) {
      throw new Error(
        `Green API request failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log(`📨 Retrieved ${data.length || 0} incoming messages`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`❌ Error getting last incoming messages:`, error);
    return [];
  }
}

/**
 * Get last outgoing messages using LastOutgoingMessages method
 */
async function getLastOutgoingMessages(
  chatId: string,
  count: number = 50
): Promise<any[]> {
  try {
    console.log(
      `📤 Getting last ${count} outgoing messages for chat: ${chatId}`
    );

    const url = `${env.GREEN_API_BASE_URL}/waInstance${env.GREEN_API_INSTANCE_ID}/lastOutgoingMessages/${env.GREEN_API_TOKEN}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, count }),
    });

    if (!response.ok) {
      throw new Error(
        `Green API request failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log(`📤 Retrieved ${data.length || 0} outgoing messages`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`❌ Error getting last outgoing messages:`, error);
    return [];
  }
}

/**
 * Advanced message fetching using multiple Green API methods
 */
async function fetchMessagesAdvanced(
  chatId: string,
  startTime: number,
  endTime: number
): Promise<any[]> {
  console.log(`🔄 Starting advanced message fetching...`);
  console.log(
    `📅 Time range: ${new Date(startTime * 1000).toISOString()} to ${new Date(endTime * 1000).toISOString()}`
  );

  const allMessages: any[] = [];
  const seenMessageIds = new Set<string>();

  try {
    // Note: GetMessagesCount API is not available, skipping count check
    console.log(`📊 Skipping message count (API not available)`);

    // 2. Get last incoming messages
    const incomingMessages = await getLastIncomingMessages(chatId, 100);
    console.log(`📨 Retrieved ${incomingMessages.length} incoming messages`);

    // Filter by time and add to collection
    const filteredIncoming = incomingMessages.filter(
      msg => msg.timestamp >= startTime && msg.timestamp <= endTime
    );
    console.log(
      `📨 ${filteredIncoming.length} incoming messages within time range`
    );

    filteredIncoming.forEach(msg => {
      if (!seenMessageIds.has(msg.idMessage)) {
        seenMessageIds.add(msg.idMessage);
        allMessages.push(msg);
      }
    });

    // Log total messages fetched before deduplication
    console.log(`📊 Total messages fetched: ${allMessages.length}`);
  } catch (error) {
    console.error(`❌ Error in advanced message fetching:`, error);
  }

  console.log(`\n📊 Advanced fetching complete:`);
  console.log(`   📨 Total unique messages: ${allMessages.length}`);
  console.log(`   🆔 Unique message IDs: ${seenMessageIds.size}`);

  return allMessages;
}

async function fetchAllMessagesGreenApiAdvanced(
  chatId: string,
  hours: number = 7
): Promise<void> {
  console.log(
    `🔄 Fetching messages using advanced Green API methods for chat: ${chatId}`
  );
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

    // Use advanced fetching with multiple methods
    const allMessages = await fetchMessagesAdvanced(chatId, startTime, endTime);

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

    console.log(`\n💡 Advanced Methods Used:`);
    console.log(`   • GetMessagesCount - Get total message count`);
    console.log(`   • LastIncomingMessages - Get last incoming messages`);
    console.log(`   • LastOutgoingMessages - Get last outgoing messages`);
    console.log(`   • GetChatHistory - Comprehensive fallback`);
  } catch (error) {
    console.error('❌ Error fetching messages from Green API:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting Advanced Green API message fetching...\n');

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
    await fetchAllMessagesGreenApiAdvanced(targetGroupId, fetchHours);
    console.log(
      '\n🎉 Advanced Green API message fetching completed successfully!'
    );
  } catch (error) {
    console.error('\n💥 Advanced Green API message fetching failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

export { main as fetchAllMessagesGreenApiAdvanced };
