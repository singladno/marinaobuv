#!/usr/bin/env tsx

/**
 * TRULY Optimized Green API message fetcher using LastIncomingMessages
 * ONE API call returns ALL messages with media URLs included!
 */

import './load-env';
import { prisma } from '../lib/db-node';
import { ParsingProgressService } from '../lib/services/parsing-progress-service';
import { env } from '../lib/env';
import { greenApiFetcher } from '../lib/green-api-fetcher';
import { extractNormalizedPhone } from '../lib/utils/whatsapp-phone-extractor';

async function processMessage(
  message: any,
  counters: { newSaved: number; duplicates: number }
): Promise<void> {
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
      counters.duplicates += 1;
      return;
    }

    // Get media URL from downloadUrl field
    const mediaUrl = message.downloadUrl || null;

    // Extract normalized phone from WhatsApp ID
    const normalizedFrom = extractNormalizedPhone(message.senderId);

    // Save message with media URL
    await prisma.whatsAppMessage.create({
      data: {
        waMessageId: message.idMessage,
        chatId: message.chatId,
        from: normalizedFrom || message.senderId || null,
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
    counters.newSaved += 1;
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
    // ONE API CALL GETS EVERYTHING!
    const fetchHours = 12; // Use 12 hours to catch older messages
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

    let allMessages;
    if (!response.ok) {
      if (response.status === 429) {
        console.log(`⚠️  Rate limited, waiting 10 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
        // Retry once after delay
        const retryResponse = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!retryResponse.ok) {
          throw new Error(`API failed after retry: ${retryResponse.status}`);
        }
        allMessages = await retryResponse.json();
        console.log(
          `📨 Got ${allMessages.length} messages with media URLs included (after retry)!`
        );
      } else {
        throw new Error(`API failed: ${response.status}`);
      }
    } else {
      allMessages = await response.json();
      console.log(
        `📨 Got ${allMessages.length} messages with media URLs included!`
      );
    }

    // Filter messages by target group ID
    const messages = allMessages.filter((msg: any) => msg.chatId === chatId);
    console.log(
      `🎯 Filtered to ${messages.length} messages from target group: ${chatId}`
    );

    // Update parsing progress with messages fetched (if PARSING_HISTORY_ID provided)
    const parsingHistoryId = process.env.PARSING_HISTORY_ID;
    if (parsingHistoryId) {
      const progress = new ParsingProgressService(parsingHistoryId);
      await progress.updateMessagesRead(messages.length);
    }

    // Process filtered messages
    let processed = 0;
    const counters = { newSaved: 0, duplicates: 0 };
    for (const message of messages) {
      await processMessage(message, counters);
      processed++;
    }

    console.log(`\n🎉 DONE! Processed ${processed} messages`);
    console.log(
      `🆕 New saved: ${counters.newSaved}, 🔁 Duplicates skipped: ${counters.duplicates}`
    );
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
