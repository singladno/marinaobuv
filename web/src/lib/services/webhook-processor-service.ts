import { buildKey, putBuffer, publicUrl, computeSha256 } from '@/lib/s3u';
import { prisma } from '@/lib/db-node';
import {
  isGroupJid,
  extractMessageText,
  mediaInfo,
  fetchMediaBuffer,
} from '@/lib/whapi';
import { normalizeTextToDraft } from '@/lib/yagpt';
import { WebhookPayloadSchema, isMessagesUpsert } from '@/types/whapi';

export async function processWebhookPayload(payload: any) {
  if (!isMessagesUpsert(payload)) {
    return { processed: false, message: 'Not a messages upsert event' };
  }

  const { data } = payload as any;
  const messages: any[] =
    data && Array.isArray(data.messages) ? data.messages : [];

  for (const message of messages) {
    await processMessage(message);
  }

  return { processed: true, message: `Processed ${messages.length} messages` };
}

async function processMessage(message: any) {
  const { key, message: msg } = message;

  if (!isGroupJid(key.remoteJid)) {
    return;
  }

  const messageText = extractMessageText(msg);
  if (!messageText) {
    return;
  }

  // Process media if present
  let mediaUrl: string | null = null;
  if (msg.message?.imageMessage || msg.message?.documentMessage) {
    mediaUrl = await processMediaMessage(msg);
  }

  // Save message to database
  await saveMessage({
    waMessageId: key.id,
    from: key.remoteJid,
    fromName: msg.message?.conversation || 'Unknown',
    type: msg.message?.imageMessage ? 'image' : 'text',
    text: messageText,
    timestamp: msg.messageTimestamp,
    mediaUrl,
    mediaMimeType: mediaUrl ? await getMediaMimeType(msg) : null,
    mediaWidth: msg.message?.imageMessage?.width || null,
    mediaHeight: msg.message?.imageMessage?.height || null,
  });

  // Process with AI if it's a product message
  if (isProductMessage(messageText)) {
    await processWithAI(messageText, mediaUrl);
  }
}

async function processMediaMessage(msg: any): Promise<string | null> {
  try {
    const media = mediaInfo(msg);
    if (!media) return null;

    const buffer = await fetchMediaBuffer({
      url: media.url,
      token: process.env.WHAPI_TOKEN as string,
    });
    if (!buffer) return null;

    const sha256 = computeSha256(buffer.buf);
    const key = buildKey(`media/${sha256}.${buffer.ext}`);

    await putBuffer(key, buffer.buf, buffer.mime);
    return publicUrl(key);
  } catch (error) {
    console.error('Error processing media:', error);
    return null;
  }
}

async function getMediaMimeType(msg: any): Promise<string | null> {
  if (msg.message?.imageMessage?.mimetype) {
    return msg.message.imageMessage.mimetype;
  }
  if (msg.message?.documentMessage?.mimetype) {
    return msg.message.documentMessage.mimetype;
  }
  return null;
}

async function saveMessage(data: {
  waMessageId: string;
  from: string;
  fromName: string;
  type: string;
  text: string;
  timestamp: number;
  mediaUrl: string | null;
  mediaMimeType: string | null;
  mediaWidth: number | null;
  mediaHeight: number | null;
}) {
  return prisma.whatsAppMessage.create({
    data: {
      ...data,
      provider: {
        connectOrCreate: {
          where: { name: 'WHAPI' },
          create: { name: 'WHAPI' },
        },
      },
    },
  });
}

function isProductMessage(text: string): boolean {
  // Simple heuristic to detect product messages
  const productKeywords = ['размер', 'пара', 'цена', 'товар', 'обувь'];
  return productKeywords.some(keyword => text.toLowerCase().includes(keyword));
}

async function processWithAI(text: string, mediaUrl: string | null) {
  try {
    const result = await normalizeTextToDraft(text);
    if (result) {
      console.log('AI processing result:', result);
    }
  } catch (error) {
    console.error('Error processing with AI:', error);
  }
}
