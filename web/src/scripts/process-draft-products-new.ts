import { prisma } from '../lib/server/db';
import { groupMessagesForProductContext } from '../lib/message-grouping';
import { processImagesFromMessages } from '../lib/draft-image-processor';
import {
  createDraftProduct,
  getOrCreateProvider,
  DraftProductData,
} from '../lib/draft-product-creator';
import { normalizeTextToDraft } from '../lib/yagpt';

/**
 * Get messages that need processing (all unprocessed messages)
 */
async function getMessagesForProcessing(limit: number = 50): Promise<string[]> {
  const messages = await prisma.whatsAppMessage.findMany({
    where: {
      fromMe: false,
      processed: false, // Only unprocessed messages
      OR: [
        { text: { not: null } },
        { type: { in: ['image', 'video', 'document'] } },
      ],
    },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return messages.map(msg => msg.id);
}

/**
 * Process a group of messages into a draft product
 */
async function processMessageGroupToDraft(
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

    // Combine all text content from messages
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

    if (textContents.length === 0 && imageData.length === 0) {
      console.log(`No text content or images found in group ${groupKey}`);
      return;
    }

    // Combine all text with media info
    const combinedText = [...textContents, ...mediaInfo].join('\n\n');
    console.log(`Combined text for group ${groupKey}:`, combinedText);

    // Process with YandexGPT
    let productDraft = await normalizeTextToDraft(combinedText);

    // If YandexGPT fails but we have images, create a basic product entry
    if (!productDraft && imageData.length > 0) {
      console.log(
        `YandexGPT failed but found ${imageData.length} images - creating basic product entry`
      );
      productDraft = {
        name: `Товар от ${messages[0].fromName || 'Поставщика'}`,
        notes: `Товар с ${imageData.length} изображениями`,
      };
    }

    // If still no product data, try to extract basic info from text
    if (!productDraft && textContents.length > 0) {
      console.log(`YandexGPT failed, creating basic product from text`);
      productDraft = {
        name: `Товар от ${messages[0].fromName || 'Поставщика'}`,
        notes: `Извлечено из текста: ${textContents[0].substring(0, 100)}...`,
      };
    }

    if (!productDraft) {
      console.log(
        `No product data extracted from group ${groupKey} - skipping`
      );
      return;
    }

    console.log(`GPT Response for group ${groupKey}:`, productDraft);

    // Convert to our DraftProductData format
    const productData: DraftProductData = {
      name: productDraft.name || null,
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
        ? productDraft.sizes.map(s => ({ size: s.size, stock: s.count }))
        : null,
    };

    // Validate that we have at least a name
    if (!productData.name) {
      console.log(
        `No product name extracted from group ${groupKey} - skipping`
      );
      return;
    }

    // Create draft product for the first message in the group
    const firstMessage = messages[0];
    // Ensure we have a providerId; derive if missing
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

    console.log(`Successfully processed group ${groupKey}`);
  } catch (error) {
    console.error(`Error processing message group ${groupKey}:`, error);
  }
}

/**
 * Main processing function
 */
async function main() {
  try {
    console.log('Starting draft product processing with message grouping...');

    // Get messages that need processing (all unprocessed messages)
    const messageIds = await getMessagesForProcessing(1000);
    console.log(`Found ${messageIds.length} messages to process`);

    if (messageIds.length === 0) {
      console.log('No messages to process');
      return;
    }

    // Group messages by user and time proximity
    console.log('Grouping messages by user and time...');
    const messageGroups = await groupMessagesForProductContext(messageIds);

    console.log(`Created ${Object.keys(messageGroups).length} message groups:`);
    for (const [groupKey, groupMessageIds] of Object.entries(messageGroups)) {
      console.log(`  ${groupKey}: ${groupMessageIds.length} messages`);
    }

    let processed = 0;
    let errors = 0;

    for (const [groupKey, groupMessageIds] of Object.entries(messageGroups)) {
      try {
        await processMessageGroupToDraft(groupMessageIds, groupKey);
        processed++;
      } catch (e) {
        console.error('Error processing message group to draft', groupKey, e);
        errors++;
      }
    }

    console.log('Draft product processing complete!');
    console.log(`Processed: ${processed}, Errors: ${errors}`);
  } catch (e) {
    console.error('Failed to process draft products:', e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main();
}
