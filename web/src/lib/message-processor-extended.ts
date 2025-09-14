import { prisma } from './db';
import { extractMessageText, mediaInfo, fetchMediaBuffer } from './whapi';
import { normalizeTextToDraft } from './yagpt';
import { processProviderFromMessage } from './provider-utils';
import { putBuffer, buildKey } from './s3u';
import { env } from './env';
import { WhatsAppMessage } from './message-fetcher';

/**
 * Process media upload for a message
 */
export async function processMediaUpload(message: WhatsAppMessage): Promise<{
  mediaS3Key: string | null;
  mediaUrl: string | null;
}> {
  // Extract media info from WHAPI response structure
  const rawPayload = message as any;
  let media: { id?: string; url?: string; mimeType?: string } | null = null;

  // Check for different media types in WHAPI response
  if (rawPayload.image) {
    media = {
      id: rawPayload.image.id,
      url: rawPayload.image.link,
      mimeType: rawPayload.image.mime_type
    };
  } else if (rawPayload.video) {
    media = {
      id: rawPayload.video.id,
      url: rawPayload.video.link,
      mimeType: rawPayload.video.mime_type
    };
  } else if (rawPayload.document) {
    media = {
      id: rawPayload.document.id,
      url: rawPayload.document.link,
      mimeType: rawPayload.document.mime_type
    };
  }

  if (!media || (!media.id && !media.url)) {
    return { mediaS3Key: null, mediaUrl: null };
  }

  try {
    console.log(`Processing media for message ${message.id}`);

    // For now, just store the original media URL without uploading to S3
    // This avoids S3 signature issues and we can upload later if needed
    console.log(`Media URL: ${media.url}`);
    return { mediaS3Key: null, mediaUrl: media.url };
  } catch (error) {
    console.error(`Error processing media for message ${message.id}:`, error);
    return { mediaS3Key: null, mediaUrl: null };
  }
}

/**
 * Save WhatsApp message to database
 */
export async function saveWhatsAppMessage(
  message: WhatsAppMessage,
  text: string | null,
  mediaS3Key: string | null,
  mediaUrl: string | null,
  providerId: string | null
): Promise<string> {
  // Extract data from WHAPI response structure
  const rawPayload = message as any;

  // Extract basic message fields
  const from = rawPayload.from || null;
  const type = rawPayload.type || null;
  const source = rawPayload.source || null;
  const chatId = rawPayload.chat_id || null;
  const fromMe = rawPayload.from_me || false;
  const fromName = rawPayload.from_name || null;
  const timestamp = rawPayload.timestamp ? BigInt(rawPayload.timestamp) : null;

  // Extract media fields (for image/video/audio messages)
  let mediaId = null;
  let mediaLink = null;
  let mediaWidth = null;
  let mediaHeight = null;
  let mediaSha256 = null;
  let mediaPreview = null;
  let mediaFileSize = null;
  let mediaMimeType = null;

  if (rawPayload.image) {
    mediaId = rawPayload.image.id || null;
    mediaLink = rawPayload.image.link || null;
    mediaWidth = rawPayload.image.width || null;
    mediaHeight = rawPayload.image.height || null;
    mediaSha256 = rawPayload.image.sha256 || null;
    mediaPreview = rawPayload.image.preview || null;
    mediaFileSize = rawPayload.image.file_size || null;
    mediaMimeType = rawPayload.image.mime_type || null;
  } else if (rawPayload.video) {
    mediaId = rawPayload.video.id || null;
    mediaLink = rawPayload.video.link || null;
    mediaWidth = rawPayload.video.width || null;
    mediaHeight = rawPayload.video.height || null;
    mediaSha256 = rawPayload.video.sha256 || null;
    mediaPreview = rawPayload.video.preview || null;
    mediaFileSize = rawPayload.video.file_size || null;
    mediaMimeType = rawPayload.video.mime_type || null;
  } else if (rawPayload.audio) {
    mediaId = rawPayload.audio.id || null;
    mediaLink = rawPayload.audio.link || null;
    mediaFileSize = rawPayload.audio.file_size || null;
    mediaMimeType = rawPayload.audio.mime_type || null;
  } else if (rawPayload.document) {
    mediaId = rawPayload.document.id || null;
    mediaLink = rawPayload.document.link || null;
    mediaFileSize = rawPayload.document.file_size || null;
    mediaMimeType = rawPayload.document.mime_type || null;
  }

  const waMessage = await prisma.whatsAppMessage.upsert({
    where: { waMessageId: message.id }, // Use waMessageId for deduplication
    update: {

      // Basic message fields
      from,
      type,
      source,
      chatId,
      fromMe,
      fromName,
      timestamp,

      // Media fields
      mediaId,
      mediaLink,
      mediaWidth,
      mediaHeight,
      mediaSha256,
      mediaPreview,
      mediaFileSize,
      mediaMimeType,

      // Extracted/processed fields
      text,
      mediaS3Key,
      mediaUrl,
      providerId,
      rawPayload: message as Record<string, unknown>,
    },
    create: {
      waMessageId: message.id, // Store WhatsApp message ID

      // Basic message fields
      from,
      type,
      source,
      chatId,
      fromMe,
      fromName,
      timestamp,

      // Media fields
      mediaId,
      mediaLink,
      mediaWidth,
      mediaHeight,
      mediaSha256,
      mediaPreview,
      mediaFileSize,
      mediaMimeType,

      // Extracted/processed fields
      text,
      mediaS3Key,
      mediaUrl,
      providerId,
      rawPayload: message as Record<string, unknown>,
    },
  });

  return waMessage.id;
}

/**
 * Process text with YandexGPT and create product draft
 */
export async function processTextWithAI(text: string, messageId: string): Promise<void> {
  try {
    console.log(`Processing text with YandexGPT for message ${messageId}`);

    const productDraft = await normalizeTextToDraft(text);

    if (!productDraft) {
      console.log(`No product data extracted from message ${messageId}`);
      return;
    }

    await prisma.productDraft.upsert({
      where: { messageId },
      update: {
        name: productDraft.name,
        article: productDraft.article || null,
        season: productDraft.season ? productDraft.season.toUpperCase() as 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER' : null,
        typeSlug: productDraft.typeSlug || null,
        pricePair: productDraft.pricePair || null,
        packPairs: productDraft.packPairs || null,
        priceBox: productDraft.priceBox || null,
        material: productDraft.material || null,
        gender: productDraft.gender ? productDraft.gender.toUpperCase() as 'FEMALE' | 'MALE' | 'UNISEX' : null,
        sizes: productDraft.sizes || null,
        rawGptResponse: productDraft as Record<string, unknown>,
      },
      create: {
        messageId,
        name: productDraft.name,
        article: productDraft.article || null,
        season: productDraft.season ? productDraft.season.toUpperCase() as 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER' : null,
        typeSlug: productDraft.typeSlug || null,
        pricePair: productDraft.pricePair || null,
        packPairs: productDraft.packPairs || null,
        priceBox: productDraft.priceBox || null,
        material: productDraft.material || null,
        gender: productDraft.gender ? productDraft.gender.toUpperCase() as 'FEMALE' | 'MALE' | 'UNISEX' : null,
        sizes: productDraft.sizes || null,
        rawGptResponse: productDraft as Record<string, unknown>,
      },
    });

    console.log(`Product draft created for message ${messageId}`);
  } catch (error) {
    console.error(`Error processing text with YandexGPT for message ${messageId}:`, error);
  }
}
