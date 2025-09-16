#!/usr/bin/env tsx

// Load environment variables from .env.local BEFORE any other imports
import './load-env';

import { prisma } from '../lib/db-node';
import { normalizeTextToDraft } from '../lib/yagpt';
import {
  DRAFT_PRODUCT_PROMPT,
  DraftProductData,
} from '../lib/draft-product-prompt';
import { processMediaUpload } from '../lib/message-processor-extended';
import { putFromUrl, buildKey, getExtensionFromMime } from '../lib/s3u';

/**
 * Process and upload images from messages to Yandex Cloud
 */
async function processImagesFromMessages(
  messages: any[]
): Promise<
  Array<{ url: string; key: string; width?: number; height?: number }>
> {
  const imageData: Array<{
    url: string;
    key: string;
    width?: number;
    height?: number;
  }> = [];

  for (const message of messages) {
    if (message.type === 'image' && message.mediaUrl) {
      try {
        console.log(
          `Processing image from message ${message.id}: ${message.mediaUrl}`
        );

        // Get file extension from MIME type or URL
        const ext = message.mediaMimeType
          ? getExtensionFromMime(message.mediaMimeType)
          : 'jpg'; // Default to jpg for images

        // Generate S3 key for draft product images
        const key = `draft-products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        // Upload image to Yandex Cloud
        const uploadResult = await putFromUrl(
          key,
          message.mediaUrl,
          message.mediaMimeType
        );

        if (uploadResult.success && uploadResult.url) {
          console.log(`Image uploaded successfully: ${uploadResult.url}`);
          imageData.push({
            url: uploadResult.url,
            key: key,
            width: message.mediaWidth || undefined,
            height: message.mediaHeight || undefined,
          });
        } else {
          console.error(
            `Failed to upload image from message ${message.id}:`,
            uploadResult.error
          );
        }
      } catch (error) {
        console.error(
          `Error processing image from message ${message.id}:`,
          error
        );
      }
    }
  }

  return imageData;
}

/**
 * Group messages by consecutive messages from the same provider
 * This ensures each group represents one product from one provider
 */
async function groupMessagesForProductContext(
  messageIds: string[]
): Promise<{ [key: string]: string[] }> {
  const messages = await prisma.whatsAppMessage.findMany({
    where: { id: { in: messageIds } },
    select: {
      id: true,
      from: true,
      fromName: true,
      text: true,
      timestamp: true,
      type: true,
      mediaUrl: true,
      mediaS3Key: true,
      createdAt: true,
      providerId: true,
    },
    orderBy: { createdAt: 'desc' }, // Start from latest messages
  });

  const groups: { [key: string]: string[] } = {};
  let currentGroup: string[] = [];
  let currentProviderId: string | null = null;
  let groupCounter = 0;

  for (const message of messages) {
    if (!message.from) continue;
    // Include messages with text OR images
    if (!message.text && message.type !== 'image') continue;

    // Use providerId if available, otherwise use from field for grouping
    const messageProviderId = message.providerId || message.from;

    // If this is the first message or from the same provider as current group
    if (currentProviderId === null || messageProviderId === currentProviderId) {
      currentGroup.push(message.id);
      currentProviderId = messageProviderId;
    } else {
      // Different provider - finalize current group and start new one
      if (currentGroup.length > 0) {
        const groupKey = `${currentProviderId}_${groupCounter}_${Date.now()}`;
        groups[groupKey] = [...currentGroup];
        groupCounter++;
      }

      // Start new group with current message
      currentGroup = [message.id];
      currentProviderId = messageProviderId;
    }
  }

  // Don't forget the last group
  if (currentGroup.length > 0 && currentProviderId) {
    const groupKey = `${currentProviderId}_${groupCounter}_${Date.now()}`;
    groups[groupKey] = [...currentGroup];
  }

  return groups;
}

/**
 * Process a group of messages to create a single draft product
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

    // Process images from messages and upload to Yandex Cloud
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

    // Note: Media handling will be implemented separately using WaDraftProductImage model

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

    const draftProduct = await prisma.waDraftProduct.create({
      data: {
        message: { connect: { id: firstMessage.id } },
        provider: { connect: { id: providerId } },
        name: productData.name,
        article: productData.article,
        pricePair: productData.pricePair,
        currency: productData.currency,
        packPairs: productData.packPairs,
        priceBox: productData.priceBox,
        material: productData.material,
        gender: productData.gender,
        season: productData.season,
        description: productData.description,
        sizes: productData.sizes,
        rawGptResponse: productDraft as unknown as Record<string, unknown>,
        gptRequest: combinedText,
        source: messageIds,
        status: 'draft',
      },
    });

    // Create draft product images
    if (imageData.length > 0) {
      console.log(`Creating ${imageData.length} draft product images...`);

      for (let i = 0; i < imageData.length; i++) {
        const img = imageData[i];
        await prisma.waDraftProductImage.create({
          data: {
            draftProductId: draftProduct.id,
            url: img.url,
            key: img.key,
            alt: `Изображение ${i + 1}`,
            sort: i,
            isPrimary: i === 0, // First image is primary
            width: img.width,
            height: img.height,
          },
        });
      }

      console.log(`Created ${imageData.length} draft product images`);
    }

    console.log(
      `Created draft product ${draftProduct.id} for group ${groupKey}`
    );

    // Link ALL messages in the group to the draft product
    await prisma.whatsAppMessage.updateMany({
      where: { id: { in: messageIds } },
      data: { draftProductId: draftProduct.id },
    });

    console.log(
      `Grouped ${messageIds.length} messages into product ${draftProduct.id}`
    );
  } catch (error) {
    console.error(`Error processing message group ${groupKey}:`, error);
  }
}

/**
 * Process a single message to create a draft product (legacy function)
 */
async function processMessageToDraft(messageId: string): Promise<void> {
  try {
    console.log(`Processing message ${messageId}...`);

    // Get the message
    const message = await prisma.whatsAppMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      console.log(`Message ${messageId} not found`);
      return;
    }

    if (
      (!message.text || message.text.trim() === '') &&
      message.type !== 'image'
    ) {
      console.log(`Message ${messageId} has no text content and no images`);
      return;
    }

    if (!message.providerId) {
      console.log(`Message ${messageId} has no provider - skipping`);
      return;
    }

    // Check if draft product already exists
    const existingDraft = await prisma.waDraftProduct.findUnique({
      where: { messageId },
    });

    if (existingDraft) {
      console.log(`Draft product already exists for message ${messageId}`);
      return;
    }

    // Process with YandexGPT
    let productDraft = await normalizeTextToDraft(message.text || '');

    // If YandexGPT fails but we have images, create a basic product entry
    if (!productDraft && imageData.length > 0) {
      console.log(
        `YandexGPT failed but found ${imageData.length} images - creating basic product entry`
      );
      productDraft = {
        name: `Товар от ${message.fromName || 'Поставщика'}`,
        notes: `Товар с ${imageData.length} изображениями`,
      };
    }

    // If still no product data, try to extract basic info from text
    if (!productDraft && message.text && message.text.trim()) {
      console.log(`YandexGPT failed, creating basic product from text`);
      productDraft = {
        name: `Товар от ${message.fromName || 'Поставщика'}`,
        notes: `Извлечено из текста: ${message.text.substring(0, 100)}...`,
      };
    }

    if (!productDraft) {
      console.log(
        `No product data extracted from message ${messageId} - skipping`
      );
      return;
    }

    console.log(`GPT Response for message ${messageId}:`, productDraft);

    // Convert to our DraftProductData format
    const productData: DraftProductData = {
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
        ? productDraft.sizes.map(s => ({ size: s.size, stock: s.count }))
        : null,
    };

    // Validate that we have at least a name
    if (!productData.name) {
      console.log(
        `No product name extracted from message ${messageId} - skipping`
      );
      return;
    }

    // Ensure providerId exists or derive it from message
    let providerId: string | null = message.providerId;
    if (!providerId && message.from && message.fromName) {
      try {
        providerId = await getOrCreateProvider(message.from, message.fromName);
        await prisma.whatsAppMessage.update({
          where: { id: message.id },
          data: { providerId },
        });
        console.log(
          `Backfilled provider ${providerId} for message ${message.id}`
        );
      } catch (e) {
        console.error('Failed to resolve provider for message', message.id, e);
      }
    }
    if (!providerId) {
      console.log(`Message ${messageId} has no provider - skipping`);
      return;
    }

    // Process images if present
    let imageData: Array<{
      url: string;
      key: string;
      width?: number;
      height?: number;
    }> = [];

    if (message.type === 'image' && message.mediaUrl) {
      try {
        console.log(
          `Processing image from message ${messageId}: ${message.mediaUrl}`
        );

        // Get file extension from MIME type or URL
        const ext = message.mediaMimeType
          ? getExtensionFromMime(message.mediaMimeType)
          : 'jpg'; // Default to jpg for images

        // Generate S3 key for draft product images
        const key = `draft-products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        // Upload image to Yandex Cloud
        const uploadResult = await putFromUrl(
          key,
          message.mediaUrl,
          message.mediaMimeType
        );

        if (uploadResult.success && uploadResult.url) {
          console.log(`Image uploaded successfully: ${uploadResult.url}`);
          imageData.push({
            url: uploadResult.url,
            key: key,
            width: message.mediaWidth || undefined,
            height: message.mediaHeight || undefined,
          });
        } else {
          console.error(
            `Failed to upload image from message ${messageId}:`,
            uploadResult.error
          );
        }
      } catch (error) {
        console.error(
          `Error processing image from message ${messageId}:`,
          error
        );
      }
    }

    // Create draft product and connect relations
    const draftProduct = await prisma.waDraftProduct.create({
      data: {
        message: { connect: { id: message.id } },
        provider: { connect: { id: providerId } },
        name: productData.name,
        article: productData.article,
        pricePair: productData.pricePair,
        currency: productData.currency || 'RUB',
        packPairs: productData.packPairs,
        priceBox: productData.priceBox,
        material: productData.material,
        gender: productData.gender,
        season: productData.season,
        description: productData.description,
        sizes: productData.sizes,
        rawGptResponse: {
          original: productDraft,
          parsed: productData,
        } as unknown as Record<string, unknown>,
        gptRequest: message.text || '',
        source: [message.id],
        status: 'draft',
      },
    });

    console.log(
      `Created draft product ${draftProduct.id} for message ${messageId}`
    );

    // Create draft product images
    if (imageData.length > 0) {
      console.log(`Creating ${imageData.length} draft product images...`);

      for (let i = 0; i < imageData.length; i++) {
        const img = imageData[i];
        try {
          await prisma.waDraftProductImage.create({
            data: {
              draftProductId: draftProduct.id,
              url: img.url,
              key: img.key,
              alt: `Изображение ${i + 1}`,
              sort: i,
              isPrimary: i === 0, // First image is primary
              width: img.width,
              height: img.height,
            },
          });
        } catch (error) {
          console.error(
            `Failed to create image record for draft product ${draftProduct.id}:`,
            error
          );
        }
      }

      console.log(`Created ${imageData.length} draft product images`);
    }

    // Link the message to the draft product
    await prisma.whatsAppMessage.update({
      where: { id: messageId },
      data: { draftProductId: draftProduct.id },
    });

    console.log(
      `Created draft product ${draftProduct.id} for message ${messageId}`
    );
  } catch (error) {
    console.error(`Error processing message ${messageId}:`, error);
  }
}

/**
 * Get or create provider from message data
 */
async function getOrCreateProvider(
  from: string,
  fromName: string
): Promise<string> {
  // Try to find by phone first
  let provider = await prisma.provider.findFirst({
    where: { phone: from },
  });

  if (provider) {
    return provider.id;
  }

  // Try to find by name
  provider = await prisma.provider.findFirst({
    where: { name: fromName },
  });

  if (provider) {
    // Update phone if not set
    if (!provider.phone) {
      await prisma.provider.update({
        where: { id: provider.id },
        data: { phone: from },
      });
    }
    return provider.id;
  }

  // Create new provider
  const newProvider = await prisma.provider.create({
    data: {
      name: fromName,
      phone: from,
    },
  });

  console.log(`Created new provider: ${fromName} (${from})`);
  return newProvider.id;
}

/**
 * Update provider information for messages that don't have it
 */
async function updateMessageProviders(): Promise<void> {
  console.log('Updating provider information for messages...');

  const messagesWithoutProvider = await prisma.whatsAppMessage.findMany({
    where: {
      providerId: null,
      from: { not: null },
      fromName: { not: null },
      fromMe: false,
    },
    take: 100, // Process in batches
  });

  console.log(
    `Found ${messagesWithoutProvider.length} messages without providers`
  );

  for (const message of messagesWithoutProvider) {
    if (!message.from || !message.fromName) continue;

    try {
      const providerId = await getOrCreateProvider(
        message.from,
        message.fromName
      );

      await prisma.whatsAppMessage.update({
        where: { id: message.id },
        data: { providerId },
      });

      console.log(`Updated message ${message.id} with provider ${providerId}`);
    } catch (error) {
      console.error(
        `Error updating provider for message ${message.id}:`,
        error
      );
    }
  }
}

/**
 * Get messages that need draft product processing
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
 * Get messages from the last N hours using WhatsApp timestamp field
 */
async function getMessagesFromLastHours(hours: number = 4): Promise<string[]> {
  // Convert hours to seconds and create BigInt timestamp
  const hoursAgoSeconds = Math.floor(
    (Date.now() - hours * 60 * 60 * 1000) / 1000
  );
  const timestampFilter = BigInt(hoursAgoSeconds);

  const messages = await prisma.whatsAppMessage.findMany({
    where: {
      fromMe: false,
      draftProduct: null, // strictly messages without a draft
      timestamp: {
        gte: timestampFilter, // Use WhatsApp timestamp field
      },
      OR: [
        { text: { not: null } },
        { type: { in: ['image', 'video', 'document'] } },
      ],
    },
    select: {
      id: true,
      timestamp: true,
      fromName: true,
      text: true,
      type: true,
    },
    orderBy: { timestamp: 'desc' }, // Order by WhatsApp timestamp
  });

  console.log(
    `Found ${messages.length} messages from last ${hours} hours (using WhatsApp timestamp):`
  );
  messages.forEach(msg => {
    const timestampDate = msg.timestamp
      ? new Date(Number(msg.timestamp) * 1000)
      : null;
    console.log(
      `  - ${timestampDate?.toISOString() || 'No timestamp'}: ${msg.fromName} - ${msg.type} - ${msg.text?.substring(0, 50) || 'no text'}...`
    );
  });

  return messages.map(msg => msg.id);
}

/**
 * Main function to process messages into draft products
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

    // Process each message group to create draft products with images
    let processed = 0;
    let skipped = 0;
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

    console.log('\nProcessing complete!');
    console.log(`Messages considered: ${messageIds.length}`);
    console.log(`Processed successfully: ${processed}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);
  } catch (error) {
    console.error('Fatal error during draft product processing:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
