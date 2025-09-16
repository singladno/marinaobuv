import { prisma } from './db-node';
import { processImagesFromMessages } from './draft-image-processor';
import {
  createDraftProduct,
  getOrCreateProvider,
  DraftProductData,
} from './draft-product-creator';
import { normalizeTextToDraft } from './yagpt';

/**
 * Extract text content from messages
 */
export function extractTextContent(messages: any[]): {
  textContents: string[];
  mediaInfo: string[];
} {
  const textContents: string[] = [];
  const mediaInfo: string[] = [];

  for (const message of messages) {
    if (message.text && message.text.trim()) {
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
  return {
    name: productDraft.name || null,
    article: productDraft.article || null,
    pricePair: productDraft.pricePair || null,
    currency: 'RUB',
    packPairs: productDraft.packPairs || null,
    priceBox: productDraft.priceBox || null,
    material: productDraft.material || null,
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
    const imageData = await processImagesFromMessages(messages);

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
    let productDraft = await normalizeTextToDraft(combinedText);

    // Create fallback product data if GPT fails
    if (!productDraft) {
      if (imageData.length > 0) {
        productDraft = {
          name: `Товар от ${messages[0].fromName || 'Поставщика'}`,
          notes: `Товар с ${imageData.length} изображениями`,
        };
      } else if (textContents.length > 0) {
        productDraft = {
          name: `Товар от ${messages[0].fromName || 'Поставщика'}`,
          notes: `Извлечено из текста: ${textContents[0].substring(0, 100)}...`,
        };
      }
    }

    if (!productDraft) {
      console.log(
        `No product data extracted from group ${groupKey} - skipping`
      );
      return;
    }

    console.log(`GPT Response for group ${groupKey}:`, productDraft);

    // Convert to our DraftProductData format
    const productData = convertToProductData(productDraft);

    // Validate that we have at least a name
    if (!productData.name) {
      console.log(
        `No product name extracted from group ${groupKey} - skipping`
      );
      return;
    }

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
