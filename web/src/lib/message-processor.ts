import { NextRequest } from 'next/server';

import { WebhookPayloadSchema, isMessagesUpsert } from '@/types/evolution';

import { processTextWithAI } from './ai-processor';
import { prisma } from './db';
import { isGroupJid, extractMessageText, extractMediaInfo } from './evo';
import { processMediaUpload } from './media-processor';

export async function saveWhatsAppMessage(
  data: Record<string, unknown>,
  text: string | null,
  mediaS3Key: string | null,
  mediaUrl: string | null,
  body: Record<string, unknown>
): Promise<string> {
  const key = data.key as Record<string, unknown>;

  const waMessage = await prisma.whatsAppMessage.upsert({
    where: { waMessageId: key.id as string },
    update: {
      remoteJid: key.remoteJid as string,
      fromMe: key.fromMe as boolean,
      pushName: data.pushName as string | null,
      messageType: data.messageType as string | null,
      text,
      mediaS3Key,
      mediaUrl,
      rawPayload: body as any,
    },
    create: {
      waMessageId: key.id as string,
      remoteJid: key.remoteJid as string,
      fromMe: key.fromMe as boolean,
      pushName: data.pushName as string | null,
      messageType: data.messageType as string | null,
      text,
      mediaS3Key,
      mediaUrl,
      rawPayload: body as any,
    },
  });

  return waMessage.id;
}

export async function processWebhookPayload(request: NextRequest): Promise<{ success: boolean; error?: string }> {
  try {
    // Parse and validate payload
    const body = await request.json();
    const parseResult = WebhookPayloadSchema.safeParse(body);

    if (!parseResult.success) {
      console.error('Invalid webhook payload:', parseResult.error);
      return { success: false, error: 'Invalid payload' };
    }

    const payload = parseResult.data;

    // Only process MESSAGES_UPSERT events
    if (!isMessagesUpsert(payload)) {
      console.log('Ignoring non-upsert event:', payload.event);
      return { success: true };
    }

    const { data } = payload;

    // Skip messages from ourselves
    if (data.key.fromMe) {
      console.log('Skipping message from self');
      return { success: true };
    }

    // Only process group messages
    if (!isGroupJid(data.key.remoteJid)) {
      console.log('Skipping non-group message');
      return { success: true };
    }

    console.log('Processing group message:', {
      remoteJid: data.key.remoteJid,
      messageId: data.key.id,
      pushName: data.pushName,
    });

    // Extract text content
    const text = data.message ? extractMessageText(data.message) : null;

    // Extract media info
    const mediaInfo = data.message ? extractMediaInfo(data.message) : null;

    // Handle media upload to S3
    const { mediaS3Key, mediaUrl } = mediaInfo
      ? await processMediaUpload(mediaInfo)
      : { mediaS3Key: null, mediaUrl: null };

    // Save WhatsApp message to database
    const messageId = await saveWhatsAppMessage(data, text, mediaS3Key, mediaUrl, body);

    // Process text with YandexGPT if available
    if (text && text.trim().length > 0) {
      await processTextWithAI(text, messageId);
    }

    return { success: true };
  } catch (error) {
    console.error('Webhook processing error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
