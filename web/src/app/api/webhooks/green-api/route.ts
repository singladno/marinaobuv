import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db-node';
import { env } from '../../../../lib/env';
import { extractNormalizedPhone } from '../../../../lib/utils/whatsapp-phone-extractor';

/**
 * Green API Webhook Handler
 * Handles incoming messages with media URLs from Green API
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    // Reduced logging to prevent main thread clutter
    console.log(
      `🔔 Webhook: ${payload.typeWebhook} from ${payload.senderData?.chatId || 'unknown'}`
    );

    // Check if this is an incoming message
    if (payload.typeWebhook === 'incomingMessageReceived') {
      await handleIncomingMessage(payload);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Green API webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleIncomingMessage(payload: any) {
  const { messageData, senderData, idMessage, timestamp } = payload;

  if (!messageData || !idMessage) {
    console.log('⚠️  Invalid message data, skipping');
    return;
  }

  // Extract chat ID and check if it's our target group
  const chatId = senderData?.chatId || null;
  if (!chatId) {
    console.log('⚠️  No chat ID found, skipping');
    return;
  }

  // Filter messages to only process our target group
  if (chatId !== env.TARGET_GROUP_ID) {
    // Reduced logging for non-target groups
    return;
  }

  // Extract media information if present
  let mediaUrl: string | null = null;
  let mediaMimeType: string | null = null;
  let mediaFileName: string | null = null;
  let mediaCaption: string | null = null;
  let mediaThumbnail: string | null = null;

  // Check for media in the message data directly (Green API structure)
  if (messageData.downloadUrl) {
    mediaUrl = messageData.downloadUrl;
    mediaMimeType = messageData.mimeType || null;
    mediaFileName = messageData.fileName || null;
    mediaCaption = messageData.caption || null;
    mediaThumbnail = messageData.jpegThumbnail || null;

    // Media URL found (reduced logging)
  }
  // Fallback: Check for file message data (alternative structure)
  else if (messageData.fileMessageData) {
    const fileData = messageData.fileMessageData;
    mediaUrl = fileData.downloadUrl || null;
    mediaMimeType = fileData.mimeType || null;
    mediaFileName = fileData.fileName || null;
    mediaCaption = fileData.caption || null;
    mediaThumbnail = fileData.jpegThumbnail || null;

    // Media URL found in fileMessageData (reduced logging)
  }

  // Extract text content - handle textMessage, extendedTextMessage, and their data variants
  const text =
    messageData.textMessage ||
    messageData.textMessageData?.textMessage ||
    messageData.extendedTextMessage?.text ||
    messageData.extendedTextMessageData?.text ||
    null;

  // Extract sender information and normalize phone number
  const rawFrom = senderData?.sender || null;
  const from = extractNormalizedPhone(rawFrom);
  const fromName = senderData?.senderName || null;

  try {
    // Check if message already exists
    const existingMessage = await prisma.whatsAppMessage.findUnique({
      where: { waMessageId: idMessage },
    });

    if (existingMessage) {
      console.log(`Message ${idMessage} already exists, skipping`);
      return;
    }

    // Save message to database
    await prisma.whatsAppMessage.create({
      data: {
        waMessageId: idMessage,
        chatId: chatId,
        from: from,
        fromName: fromName,
        text: text,
        type: messageData.typeMessage,
        timestamp: BigInt(timestamp),
        fromMe: false, // Incoming messages are not from us
        mediaUrl: mediaUrl,
        mediaMimeType: mediaMimeType,
        mediaFileSize: null, // Not provided in webhook
        rawPayload: payload,
      },
    });

    console.log(
      `✅ Successfully saved webhook message ${idMessage}${mediaUrl ? ` with media: ${mediaUrl}` : ''}`
    );
  } catch (error) {
    console.error(`❌ Error processing webhook message ${idMessage}:`, error);
  }
}

// Handle GET requests (for webhook verification)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Green API webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
