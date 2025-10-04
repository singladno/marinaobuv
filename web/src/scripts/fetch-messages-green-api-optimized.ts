#!/usr/bin/env tsx

/**
 * TRULY Optimized Green API message fetcher using LastIncomingMessages
 * ONE API call returns ALL messages with media URLs included!
 */

import './load-env';
import { prisma } from '../lib/db-node';
import { env } from '../lib/env';
import { greenApiFetcher } from '../lib/green-api-fetcher';

async function processMessage(message: any): Promise<void> {
  try {
    // Skip system messages
    if (message.type === 'group_invite') {
      return;
    }

    console.log(
      `Processing ${message.typeMessage} from ${message.senderName || 'Unknown'}`
    );

    // Check if message already exists
    const existing = await prisma.whatsAppMessage.findUnique({
      where: { waMessageId: message.idMessage },
    });

    if (existing) {
      return;
    }

    // Get media URL from downloadUrl field
    const mediaUrl = message.downloadUrl || null;

    // Save message with media URL
    await prisma.whatsAppMessage.create({
      data: {
        waMessageId: message.idMessage,
        chatId: message.chatId,
        from: message.senderId || null,
        fromName: message.senderName || null,
        text: message.textMessage || null,
        type: message.typeMessage,
        timestamp: BigInt(message.timestamp),
        fromMe: false,
        mediaUrl: mediaUrl,
        mediaMimeType: message.mimeType || null,
        rawPayload: message as any,
      },
    });

    console.log(
      `✅ Saved ${message.typeMessage}${mediaUrl ? ' with media' : ''}`
    );
  } catch (error) {
    console.error(`❌ Error processing ${message.idMessage}:`, error);
  }
}

async function main() {
  console.log('🚀 TRULY Optimized Green API - ONE REQUEST GETS EVERYTHING!\n');

  if (!env.GREEN_API_INSTANCE_ID || !env.GREEN_API_TOKEN) {
    console.error('❌ Green API credentials not configured!');
    process.exit(1);
  }

  if (!env.TARGET_GROUP_ID) {
    console.error('❌ TARGET_GROUP_ID not configured!');
    process.exit(1);
  }

  const chatId = env.TARGET_GROUP_ID;
  console.log(`🎯 Target group: ${chatId}`);

  try {
    // Check if instance is ready
    const isReady = await greenApiFetcher.isReady();
    if (!isReady) {
      console.log('⚠️  Enabling Green API settings...');
      await greenApiFetcher.enableMessageFetching();
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait longer to avoid rate limits
    }

    // ONE API CALL GETS EVERYTHING!
    const fetchHours = env.MESSAGE_FETCH_HOURS;
    const fetchMinutes = Math.round(fetchHours * 60);
    console.log(
      `\n⏰⏰⏰ TIME WINDOW: ${fetchHours} hours (${fetchMinutes} minutes) ⏰⏰⏰\n`
    );
    console.log(
      `📨 Making ONE API call to get messages from last ${fetchHours} hours (${fetchMinutes} minutes)...`
    );

    const url = `${env.GREEN_API_BASE_URL}/waInstance${env.GREEN_API_INSTANCE_ID}/lastIncomingMessages/${env.GREEN_API_TOKEN}?minutes=${fetchMinutes}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`API failed: ${response.status}`);
    }

    const allMessages = await response.json();
    console.log(
      `📨 Got ${allMessages.length} messages with media URLs included!`
    );

    // Filter messages by target group ID
    const messages = allMessages.filter((msg: any) => msg.chatId === chatId);
    console.log(
      `🎯 Filtered to ${messages.length} messages from target group: ${chatId}`
    );

    // Process filtered messages
    let processed = 0;
    for (const message of messages) {
      await processMessage(message);
      processed++;
    }

    console.log(`\n🎉 DONE! Processed ${processed} messages`);
    console.log(
      '💡 ONE API call got everything - using downloadUrl from API response!'
    );
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
