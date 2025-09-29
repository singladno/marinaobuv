import { prisma } from './db-node';
import { ImageProcessingService } from './services/image-processing-service';
import {
  createDraftProduct,
  getOrCreateProvider,
  DraftProductData,
} from './draft-product-creator';
import { normalizeTextToDraft } from './yagpt';

/**
 * Extract text content from messages
 */
export function extractTextContent(
  messages: Array<{ text?: string; media?: { type: string; url: string } }>
): {
  textContents: string[];
  mediaInfo: string[];
} {
  const textContents: string[] = [];
  const mediaInfo: string[] = [];

  for (const message of messages as any[]) {
    if (
      message.text &&
      typeof message.text === 'string' &&
      message.text.trim()
    ) {
      textContents.push(message.text.trim());
    }

    if (message.type === 'image' && message.mediaUrl) {
      mediaInfo.push(`[Изображение: ${message.mediaUrl}]`);
    }
  }

  return { textContents, mediaInfo };
}

/**
 * Convert GPT response to product data
 */
export function convertToProductData(productDraft: any): DraftProductData {
  // Normalize prices: ensure both pair and box prices are populated when possible
  const packPairs = productDraft.packPairs || null;
  const pricePairRaw =
    productDraft.pricePair != null ? Number(productDraft.pricePair) : null;
  const priceBoxRaw =
    productDraft.priceBox != null ? Number(productDraft.priceBox) : null;

  let pricePair: number | null = pricePairRaw;
  let priceBox: number | null = priceBoxRaw;

  if (pricePair == null && priceBox != null && packPairs) {
    pricePair = Math.round(priceBox / packPairs);
  }
  if (priceBox == null && pricePair != null && packPairs) {
    priceBox = pricePair * packPairs;
  }

  return {
    name: productDraft.name || null,
    pricePair: pricePair,
    currency: 'RUB',

    // material: productDraft.material || null, // Commented out as it's not in DraftProductData
    gender: productDraft.gender
      ? (productDraft.gender.toUpperCase() as 'FEMALE' | 'MALE' | 'UNISEX')
      : null,
    season: productDraft.season
      ? (productDraft.season.toUpperCase() as
          | 'SPRING'
          | 'SUMMER'
          | 'AUTUMN'
          | 'WINTER')
      : null,
    description: productDraft.notes || null,
    sizes: productDraft.sizes
      ? productDraft.sizes.map((s: any) => ({ size: s.size, stock: s.count }))
      : null,
    providerDiscount: productDraft.providerDiscount || null,
  };
}

/**
 * Process a group of messages into a draft product
 */
export async function processMessageGroupToDraft(
  messageIds: string[],
  groupKey: string
): Promise<void> {
  try {
    console.log(
      `Processing message group ${groupKey} with ${messageIds.length} messages...`
    );

    // Get all messages in the group
    const messages = await prisma.whatsAppMessage.findMany({
      where: { id: { in: messageIds } },
      orderBy: { createdAt: 'asc' },
    });

    if (messages.length === 0) {
      console.log(`No messages found for group ${groupKey}`);
      return;
    }

    // Check if any message already has a draft product
    const existingDrafts = await prisma.waDraftProduct.findMany({
      where: { messageId: { in: messageIds } },
    });

    if (existingDrafts.length > 0) {
      console.log(`Draft products already exist for group ${groupKey}`);
      return;
    }

    // Process images from messages and upload to S3
    console.log(`Processing images for group ${groupKey}...`);
    const imageService = new ImageProcessingService();
    const imageData = await imageService.processImagesFromMessages(
      messages as any[]
    );

    // Extract text content
    const { textContents, mediaInfo } = extractTextContent(messages);

    if (textContents.length === 0 && imageData.length === 0) {
      console.log(`No text content or images found in group ${groupKey}`);
      return;
    }

    // Combine all text with media info
    const combinedText = [...textContents, ...mediaInfo].join('\n\n');
    console.log(`Combined text for group ${groupKey}:`, combinedText);

    // Process with YandexGPT
    const productDraft = await normalizeTextToDraft(combinedText);

    if (!productDraft) {
      throw new Error(
        `GPT failed to extract product data from group ${groupKey}. Text: ${combinedText.substring(0, 200)}...`
      );
    }

    console.log(`GPT Response for group ${groupKey}:`, productDraft);

    // Convert to our DraftProductData format
    const productData = convertToProductData(productDraft);

    // Name will be filled during second phase (image analysis)

    // Get or create provider
    const firstMessage = messages[0];
    let providerId: string | null = firstMessage.providerId ?? null;
    if (!providerId) {
      try {
        providerId = await getOrCreateProvider(
          firstMessage.from || '',
          firstMessage.fromName || 'unknown'
        );
      } catch (e) {
        console.error(
          'Failed to resolve provider for message',
          firstMessage.id,
          e
        );
      }
    }

    if (!providerId) {
      console.log(`No providerId for group ${groupKey} - skipping`);
      return;
    }

    // Create the draft product
    await createDraftProduct(
      firstMessage.id,
      providerId,
      productData,
      combinedText,
      productDraft,
      messageIds,
      imageData
    );

    // Second pass disabled for now

    // Mark all messages in the group as processed
    await prisma.whatsAppMessage.updateMany({
      where: { id: { in: messageIds } },
      data: { processed: true },
    });

    console.log(`Successfully processed group ${groupKey}`);
  } catch (error) {
    console.error(`Error processing message group ${groupKey}:`, error);
  }
}
