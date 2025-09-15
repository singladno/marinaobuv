#!/usr/bin/env tsx

// Load environment variables from .env.local BEFORE any other imports
import './load-env';

import { prisma } from '../lib/db';
import { normalizeTextToDraft } from '../lib/yagpt';
import {
  DRAFT_PRODUCT_PROMPT,
  DraftProductData,
} from '../lib/draft-product-prompt';
import { processMediaUpload } from '../lib/message-processor-extended';

/**
 * Group messages by user and time proximity for product context
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
    },
    orderBy: { createdAt: 'asc' },
  });

  const groups: { [key: string]: string[] } = {};
  const TIME_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

  for (const message of messages) {
    if (!message.from || !message.text) continue;

    const userKey = `${message.from}_${message.fromName || 'unknown'}`;
    const messageTime = new Date(
      Number(message.timestamp) || message.createdAt
    ).getTime();

    // Find existing group for this user within time window
    let groupFound = false;
    for (const [groupKey, groupMessageIds] of Object.entries(groups)) {
      if (groupKey.startsWith(message.from)) {
        // Check if this message is within time window of the last message in group
        const lastMessageId = groupMessageIds[groupMessageIds.length - 1];
        const lastMessage = messages.find(m => m.id === lastMessageId);
        if (lastMessage) {
          const lastMessageTime = new Date(
            Number(lastMessage.timestamp) || lastMessage.createdAt
          ).getTime();
          if (messageTime - lastMessageTime <= TIME_WINDOW_MS) {
            groups[groupKey].push(message.id);
            groupFound = true;
            break;
          }
        }
      }
    }

    // If no group found, create new one
    if (!groupFound) {
      groups[`${userKey}_${messageTime}`] = [message.id];
    }
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

    if (textContents.length === 0) {
      console.log(`No text content found in group ${groupKey}`);
      return;
    }

    // Combine all text with media info
    const combinedText = [...textContents, ...mediaInfo].join('\n\n');

    console.log(`Combined text for group ${groupKey}:`, combinedText);

    // Process with YandexGPT
    const productDraft = await normalizeTextToDraft(combinedText);

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
    const draftProduct = await prisma.waDraftProduct.create({
      data: {
        messageId: firstMessage.id,
        providerId: firstMessage.providerId!,
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
        rawGptResponse: JSON.stringify(productDraft),
        status: 'DRAFT',
      },
    });

    console.log(
      `Created draft product ${draftProduct.id} for group ${groupKey}`
    );

    // Mark all messages in the group as processed by creating a reference
    // (we could add a field to track grouped messages, but for now we'll just log)
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

    if (!message.text || message.text.trim() === '') {
      console.log(`Message ${messageId} has no text content`);
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
    const productDraft = await normalizeTextToDraft(message.text);

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

    // Process media if present
    let mediaS3Key: string | null = null;
    let mediaUrl: string | null = null;

    if (message.mediaId) {
      try {
        const mediaResult = await processMediaUpload({
          id: message.waMessageId,
          type: message.type || 'image',
          media: {
            id: message.mediaId,
            mime_type: message.mediaMimeType || 'image/jpeg',
            sha256: message.mediaSha256 || '',
            file_size: message.mediaFileSize || 0,
          },
        } as any);

        mediaS3Key = mediaResult.mediaS3Key;
        mediaUrl = mediaResult.mediaUrl;
      } catch (error) {
        console.error(
          `Failed to process media for message ${messageId}:`,
          error
        );
      }
    }

    // Create draft product
    const draftProduct = await prisma.waDraftProduct.create({
      data: {
        messageId,
        providerId: message.providerId,
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
        },
        status: 'draft',
      },
    });

    console.log(
      `Created draft product ${draftProduct.id} for message ${messageId}`
    );

    // Create image record if we have media
    if (mediaS3Key && mediaUrl) {
      try {
        await prisma.waDraftProductImage.create({
          data: {
            draftProductId: draftProduct.id,
            url: mediaUrl,
            key: mediaS3Key,
            alt: productData.name || 'Product image',
            sort: 0,
            isPrimary: true,
            width: message.mediaWidth || null,
            height: message.mediaHeight || null,
          },
        });
        console.log(
          `Created image record for draft product ${draftProduct.id}`
        );
      } catch (error) {
        console.error(
          `Failed to create image record for draft product ${draftProduct.id}:`,
          error
        );
      }
    }
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
      providerId: { not: null },
      text: { not: null },
      fromMe: false,
      draftProduct: null, // No draft product exists yet
    },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return messages.map(msg => msg.id);
}

/**
 * Main function to process messages into draft products
 */
async function main() {
  try {
    console.log('Starting draft product processing with message grouping...');

    // First, update provider information for messages that don't have it
    await updateMessageProviders();

    // Get messages that need processing
    const messageIds = await getMessagesForProcessing(50);
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

    // Process each group
    let processedGroups = 0;
    let errorCount = 0;
    let totalMessagesProcessed = 0;

    for (const [groupKey, groupMessageIds] of Object.entries(messageGroups)) {
      try {
        await processMessageGroupToDraft(groupMessageIds, groupKey);
        processedGroups++;
        totalMessagesProcessed += groupMessageIds.length;
      } catch (error) {
        console.error(`Error processing group ${groupKey}:`, error);
        errorCount++;
      }
    }

    console.log('\nProcessing complete!');
    console.log(`Total message groups: ${Object.keys(messageGroups).length}`);
    console.log(`Successfully processed groups: ${processedGroups}`);
    console.log(`Total messages processed: ${totalMessagesProcessed}`);
    console.log(`Errors: ${errorCount}`);
  } catch (error) {
    console.error('Fatal error during draft product processing:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
