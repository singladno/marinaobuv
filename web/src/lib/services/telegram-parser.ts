/**
 * Telegram Parser Service
 * Parses Telegram channel messages and creates products
 */

import { PrismaClient, ProductSource } from '@prisma/client';
import { telegramFetcher } from '../telegram-fetcher';
import { telegramMTProtoFetcher } from '../telegram-mtproto-fetcher';
import { createSlug, generateArticleNumber } from './product-creation-mappers';
import { env } from '../env';
import { uploadImage, getObjectKey, getPublicUrl } from '../storage';
import { GroqSequentialProcessor } from './groq-sequential-processor';
import { logger, logServerError } from '@/lib/server/logger';

interface TelegramMessageGroup {
  messageIds: string[];
  text: string;
  images: Array<{
    url: string;
    fileId?: string;
    buffer?: Buffer;
    tgMessageId?: bigint;
  }>;
  authorId: number | null;
  authorUsername: string | null;
  authorName: string | null;
  timestamp: number;
}

interface ParsedProductData {
  location: string | null;
  price: number | null;
  boxPrice: number | null;
  amount: number | null;
  description: string;
}

export class TelegramParser {
  constructor(private prisma: PrismaClient) {}

  /**
   * Extract location from message text (e.g., "Линия 32-61/63 павильон")
   */
  private extractLocation(text: string): string | null {
    // Pattern: "Линия 32-61/63 павильон" or similar
    const locationPattern =
      /(?:Линия|линия|Павильон|павильон|Ряд|ряд)\s*([^\n]+)/i;
    const match = text.match(locationPattern);
    if (match) {
      return match[1].trim();
    }
    return null;
  }

  /**
   * Parse price and amount from message text
   * Example: "180₽×20шт＝3600Руб."
   * Returns: unit price (180), box price (3600), and amount (20)
   */
  private parsePriceAndAmount(text: string): {
    price: number | null;
    boxPrice: number | null;
    amount: number | null;
  } {
    let price: number | null = null;
    let boxPrice: number | null = null;
    let amount: number | null = null;

    // Pattern: "180₽×20шт＝3600Руб" or "180₽×20шт=3600Руб"
    const fullPattern =
      /(\d+)\s*[₽руб]+\s*[×x]\s*(\d+)\s*шт\s*[＝=]\s*(\d+)\s*[₽рубРуб]+/i;
    const fullMatch = text.match(fullPattern);
    if (fullMatch) {
      price = parseInt(fullMatch[1], 10); // Unit price: 180
      amount = parseInt(fullMatch[2], 10); // Amount: 20
      boxPrice = parseInt(fullMatch[3], 10); // Box price: 3600
    } else {
      // Pattern: "180₽×20шт" (without box price)
      const priceAmountPattern = /(\d+)\s*[₽руб]+\s*[×x]\s*(\d+)\s*шт/i;
      const match = text.match(priceAmountPattern);
      if (match) {
        price = parseInt(match[1], 10);
        amount = parseInt(match[2], 10);
      } else {
        // Try separate patterns
        const pricePattern = /(\d+)\s*[₽руб]+/i;
        const amountPattern = /(\d+)\s*шт/i;
        const priceMatch = text.match(pricePattern);
        const amountMatch = text.match(amountPattern);
        if (priceMatch) {
          price = parseInt(priceMatch[1], 10);
        }
        if (amountMatch) {
          amount = parseInt(amountMatch[1], 10);
        }
      }
    }

    return { price, boxPrice, amount };
  }

  /**
   * Group Telegram messages by author and sequence
   * Groups images + text messages from the same author into one product
   * Rules:
   * - Images should come first, then text messages
   * - If text appears first, look backwards for images from the same author
   */
  private groupMessages(
    messages: Array<{
      id: string;
      tgMessageId: number | bigint;
      fromId: number | null;
      fromUsername: string | null;
      fromFirstName: string | null;
      text: string | null;
      caption: string | null;
      mediaUrl: string | null;
      type: string | null;
      date: number;
      tgMessageIdBigInt?: bigint; // Store for re-downloading images
    }>
  ): TelegramMessageGroup[] {
    const groups: TelegramMessageGroup[] = [];
    // Messages should already be sorted by createdAt before being passed here
    // But we sort again by date to ensure correct order
    const sortedMessages = [...messages].sort((a, b) => a.date - b.date);
    const processedMessageIds = new Set<string>();
    const GROUP_TIMEOUT = 60 * 1000; // 60 seconds

    // Helper functions
    const hasText = (msg: (typeof sortedMessages)[0]) =>
      !!(msg.text || msg.caption);
    const hasImage = (msg: (typeof sortedMessages)[0]) =>
      (msg.type === 'photo' || msg.type === 'document') &&
      (!!msg.mediaUrl || (msg as any).photo);

    for (let i = 0; i < sortedMessages.length; i++) {
      const msg = sortedMessages[i];

      // Skip if already processed
      if (processedMessageIds.has(msg.id)) {
        continue;
      }

      // Skip messages that are neither text nor image
      if (!hasText(msg) && !hasImage(msg)) {
        continue;
      }

      const authorId = msg.fromId;
      const authorUsername = msg.fromUsername;
      const authorName = msg.fromFirstName || msg.fromUsername || 'Unknown';

      // Case 1: Text message appears first - look backwards for images
      if (hasText(msg) && !hasImage(msg)) {
        const images: Array<{
          url: string;
          fileId?: string;
          buffer?: Buffer;
          tgMessageId?: bigint;
        }> = [];
        const imageMessageIds: string[] = [];

        // Look backwards for images from the same author within the time window
        for (let j = i - 1; j >= 0; j--) {
          const prevMsg = sortedMessages[j];

          // Stop if we've gone too far back in time
          if (msg.date - prevMsg.date > GROUP_TIMEOUT / 1000) {
            break;
          }

          // Stop if different author
          if (prevMsg.fromId !== authorId) {
            break;
          }

          // Stop if already processed
          if (processedMessageIds.has(prevMsg.id)) {
            break;
          }

          // If this is an image message, add it to the group (unshift to maintain chronological order)
          if (hasImage(prevMsg)) {
            const imageUrl = prevMsg.mediaUrl || `telegram_photo_${prevMsg.id}`;
            const tgMessageId =
              prevMsg.tgMessageIdBigInt || (prevMsg as any).tgMessageId;
            images.unshift({
              url: imageUrl,
              fileId: imageUrl,
              buffer: (prevMsg as any).mediaBuffer,
              tgMessageId: tgMessageId
                ? BigInt(tgMessageId.toString())
                : undefined,
            });
            imageMessageIds.unshift(prevMsg.id);
            processedMessageIds.add(prevMsg.id);
          }
        }

        // If we found images, create a group with images first, then text
        if (images.length > 0) {
          const textContent = msg.text || msg.caption || '';
          const group: TelegramMessageGroup = {
            messageIds: [...imageMessageIds, msg.id],
            text: textContent,
            images: images,
            authorId,
            authorUsername,
            authorName,
            timestamp: msg.date,
          };
          groups.push(group);
          processedMessageIds.add(msg.id);
        }
        // If no images found, skip this text message (it will be picked up if images come later)
        continue;
      }

      // Case 2: Image message (or message with both image and text) - look forward for text
      if (hasImage(msg)) {
        const images: Array<{
          url: string;
          fileId?: string;
          buffer?: Buffer;
          tgMessageId?: bigint;
        }> = [];
        const imageMessageIds: string[] = [];
        let textContent = '';

        // Collect all consecutive images from the same author
        let j = i;
        while (j < sortedMessages.length) {
          const currentMsg = sortedMessages[j];

          // Stop if different author
          if (currentMsg.fromId !== authorId) {
            break;
          }

          // Stop if we've gone too far forward in time
          if (currentMsg.date - msg.date > GROUP_TIMEOUT / 1000) {
            break;
          }

          // Stop if already processed
          if (processedMessageIds.has(currentMsg.id)) {
            break;
          }

          // If this is an image message, add it
          if (hasImage(currentMsg)) {
            const imageUrl =
              currentMsg.mediaUrl || `telegram_photo_${currentMsg.id}`;
            const tgMessageId =
              currentMsg.tgMessageIdBigInt || (currentMsg as any).tgMessageId;
            images.push({
              url: imageUrl,
              fileId: imageUrl,
              buffer: (currentMsg as any).mediaBuffer,
              tgMessageId: tgMessageId
                ? BigInt(tgMessageId.toString())
                : undefined,
            });
            imageMessageIds.push(currentMsg.id);
            processedMessageIds.add(currentMsg.id);

            // Also collect text if it has caption
            if (hasText(currentMsg)) {
              const caption = currentMsg.text || currentMsg.caption || '';
              if (caption) {
                if (textContent) {
                  textContent += '\n\n' + caption;
                } else {
                  textContent = caption;
                }
              }
            }
            j++;
          } else if (hasText(currentMsg)) {
            // Found text after images - add it and stop
            const msgText = currentMsg.text || currentMsg.caption || '';
            if (msgText) {
              if (textContent) {
                textContent += '\n\n' + msgText;
              } else {
                textContent = msgText;
              }
            }
            imageMessageIds.push(currentMsg.id);
            processedMessageIds.add(currentMsg.id);
            j++;
            break;
          } else {
            // Not an image or text, stop
            break;
          }
        }

        // Only create group if we have both images and text
        if (images.length > 0 && textContent) {
          const group: TelegramMessageGroup = {
            messageIds: imageMessageIds,
            text: textContent,
            images: images,
            authorId,
            authorUsername,
            authorName,
            timestamp: msg.date,
          };
          groups.push(group);
        } else if (images.length > 0) {
          // Images without text - remove from processed so text can pick them up later
          imageMessageIds.forEach(id => processedMessageIds.delete(id));
        }
      }
    }

    return groups;
  }

  /**
   * Get or create provider from Telegram user data
   */
  private async getOrCreateProvider(
    telegramId: number | null,
    telegramUsername: string | null,
    location: string | null
  ): Promise<string> {
    // Try to find by telegramId first
    if (telegramId) {
      const byTelegramId = await this.prisma.provider.findFirst({
        where: { telegramId: telegramId },
      });
      if (byTelegramId) {
        // Update location if provided
        if (location && !byTelegramId.location) {
          await this.prisma.provider.update({
            where: { id: byTelegramId.id },
            data: { location },
          });
        }
        return byTelegramId.id;
      }
    }

    // Try by telegramUsername
    if (telegramUsername) {
      const byUsername = await this.prisma.provider.findFirst({
        where: { telegramUsername: telegramUsername },
      });
      if (byUsername) {
        // Update telegramId if missing
        if (telegramId && !byUsername.telegramId) {
          await this.prisma.provider.update({
            where: { id: byUsername.id },
            data: { telegramId },
          });
        }
        // Update location if provided
        if (location && !byUsername.location) {
          await this.prisma.provider.update({
            where: { id: byUsername.id },
            data: { location },
          });
        }
        return byUsername.id;
      }
    }

    // Create new provider
    const providerName =
      telegramUsername || `Telegram User ${telegramId || 'Unknown'}`;
    const created = await this.prisma.provider.create({
      data: {
        name: providerName,
        telegramId: telegramId || null,
        telegramUsername: telegramUsername || null,
        location: location || null,
      },
    });

    return created.id;
  }

  /**
   * Download image from Telegram by message ID
   */
  private async downloadTelegramImageByMessageId(
    tgMessageId: bigint,
    channelId: string
  ): Promise<Buffer | null> {
    try {
      // Use TELEGRAM_CHANNEL_ID directly (the channel we're parsing from)
      const channel = env.TELEGRAM_CHANNEL_ID || channelId;
      if (!channel) {
        logger.error(
          `❌ No channel ID available for downloading message ${tgMessageId}`
        );
        return null;
      }

      // Use the MTProto fetcher's public method
      const buffer = await telegramMTProtoFetcher.downloadMediaByMessageId(
        channel,
        Number(tgMessageId)
      );
      return buffer;
    } catch (error) {
      logServerError(`❌ Error downloading image for message ${tgMessageId}:`, error);
      return null;
    }
  }

  /**
   * Upload Telegram images to S3
   */
  private async uploadTelegramImagesToS3(
    productId: string,
    images: Array<{
      url: string;
      fileId?: string;
      buffer?: Buffer;
      tgMessageId?: bigint;
    }>,
    chatId?: string
  ): Promise<Array<{ url: string; key: string }>> {
    const uploadedImages: Array<{ url: string; key: string }> = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];

      try {
        let imageBuffer: Buffer | null = null;
        let contentType = 'image/jpeg';

        if (image.buffer && Buffer.isBuffer(image.buffer)) {
          // Use the buffer we downloaded from Telegram
          imageBuffer = image.buffer;
        } else if (image.url && !image.url.startsWith('telegram_photo_')) {
          // Download from URL (Bot API case)
          const response = await fetch(image.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; MarinaObuvBot/1.0)',
            },
          });
          if (!response.ok) {
            logger.debug(
              `⚠️ Failed to download image ${i + 1}: ${response.statusText}`
            );
            continue;
          }
          imageBuffer = Buffer.from(await response.arrayBuffer());
          contentType = response.headers.get('content-type') || 'image/jpeg';
        } else if (
          image.url.startsWith('telegram_photo_') &&
          image.tgMessageId &&
          chatId
        ) {
          // Re-download from Telegram using message ID
          logger.debug(
            `📥 Re-downloading image ${i + 1} from Telegram (message ${image.tgMessageId})...`
          );
          imageBuffer = await this.downloadTelegramImageByMessageId(
            image.tgMessageId,
            chatId
          );
          if (!imageBuffer) {
            logger.debug(
              `⚠️ Failed to re-download image ${i + 1} from Telegram`
            );
            continue;
          }
        } else {
          logger.debug(
            `⚠️ Skipping image ${i + 1}: no buffer, valid URL, or message ID`
          );
          continue;
        }

        if (!imageBuffer) {
          continue;
        }

        // Upload to S3
        const ext = contentType.split('/')[1] || 'jpg';
        const s3Key = getObjectKey({ productId, ext });
        const uploadSuccess = await uploadImage(
          s3Key,
          imageBuffer,
          contentType
        );

        if (uploadSuccess) {
          const publicUrl = getPublicUrl(s3Key);
          uploadedImages.push({
            url: publicUrl,
            key: s3Key,
          });
          logger.debug(`✅ Uploaded image ${i + 1} to S3: ${publicUrl}`);
        } else {
          logger.error(`❌ Failed to upload image ${i + 1} to S3`);
        }
      } catch (error) {
        logServerError(`❌ Error uploading image ${i + 1}:`, error);
        continue;
      }
    }

    return uploadedImages;
  }

  /**
   * Analyze Telegram product with GROQ
   */
  private async analyzeTelegramProductWithGroq(
    productId: string,
    messageIds: string[],
    textContent: string,
    imageUrls: string[]
  ): Promise<void> {
    if (!textContent || imageUrls.length === 0) {
      logger.debug(
        `⚠️ No valid content for GROQ analysis: text=${!!textContent}, images=${imageUrls.length}`
      );
      return;
    }

    try {
      const { Groq } = await import('groq-sdk');
      const { getGroqConfig } = await import('../groq-proxy-config');
      const { groqChatCompletion } = await import('./groq-api-wrapper');
      const {
        TELEGRAM_FLOWER_ANALYSIS_SYSTEM_PROMPT,
        TELEGRAM_FLOWER_ANALYSIS_USER_PROMPT,
      } = await import('../prompts/telegram-flower-analysis-prompts');

      const groqConfig = await getGroqConfig();
      const groq = new Groq(groqConfig);

      const response = await groqChatCompletion(
        groq,
        {
          model: process.env.GROQ_TEXT_MODEL || 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: TELEGRAM_FLOWER_ANALYSIS_SYSTEM_PROMPT,
            },
            {
              role: 'user',
              content: TELEGRAM_FLOWER_ANALYSIS_USER_PROMPT(
                textContent,
                imageUrls.length
              ),
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 2500,
        },
        `telegram-analysis-${productId}`,
        {
          maxRetries: 5,
          baseDelayMs: 2000,
          maxDelayMs: 60000,
          timeoutMs: 120000,
        }
      );

      if (!('choices' in response)) {
        throw new Error('Unexpected response type from Groq API');
      }

      const rawContent = response.choices[0].message.content || '{}';
      const analysisResult = JSON.parse(rawContent);

      // Update product with GROQ analysis results
      const updateData: any = {
        name: analysisResult.name || 'Искусственные цветы',
        description: analysisResult.description || '',
        batchProcessingStatus: 'completed',
        isActive: true, // Activate product after successful GROQ analysis
      };

      // Update prices if provided by GROQ
      // Store original price in buyPrice, apply 30% markup to pricePair
      if (analysisResult.unitPrice) {
        const originalPrice = analysisResult.unitPrice;
        const priceWithMarkup = originalPrice * 1.3; // Add 30% markup
        updateData.buyPrice = originalPrice; // Store original price
        updateData.pricePair = priceWithMarkup; // Store selling price with markup
      }
      // Note: boxPrice is not used for Telegram products, we only use unitPrice

      // Update sizes if provided by GROQ (stored as JSON array)
      if (analysisResult.sizes && Array.isArray(analysisResult.sizes)) {
        updateData.sizes = analysisResult.sizes.map((s: any) => ({
          size: s.size,
          count: s.count || 1,
        }));
      }

      await this.prisma.product.update({
        where: { id: productId },
        data: updateData,
      });

      logger.debug(
        `✅ GROQ analysis completed for product ${productId}: name="${updateData.name}", sizes=${updateData.sizes?.length || 0}`
      );
    } catch (error) {
      logServerError(`❌ GROQ analysis error for product ${productId}:`, error);
      // Don't throw - continue with basic product info
    }
  }

  /**
   * Create product from message group with S3 upload and GROQ analysis
   */
  private async createProductFromGroup(
    group: TelegramMessageGroup,
    parsedData: ParsedProductData,
    providerId: string
  ): Promise<string> {
    const { location, price, boxPrice, amount, description } = parsedData;

    // Get default category
    let defaultCategory = await this.prisma.category.findFirst({
      where: { slug: 'flowers' },
    });

    if (!defaultCategory) {
      defaultCategory = await this.prisma.category.findFirst({
        where: {
          OR: [
            { name: { contains: 'цвет', mode: 'insensitive' } },
            { name: { contains: 'flower', mode: 'insensitive' } },
          ],
        },
      });
    }

    if (!defaultCategory) {
      defaultCategory = await this.prisma.category.findFirst({
        where: { isActive: true },
        orderBy: { sort: 'asc' },
      });
    }

    if (!defaultCategory) {
      throw new Error(
        'No category found. Please create at least one category.'
      );
    }

    // Calculate prices: store original in buyPrice, apply 30% markup to pricePair
    const originalPrice = price || 0;
    const priceWithMarkup = originalPrice * 1.3; // Add 30% markup

    // Create product with temporary name (will be updated by GROQ)
    const product = await this.prisma.product.create({
      data: {
        name: 'Загрузка...', // Temporary name, will be updated by GROQ
        slug: createSlug(`telegram-product-${Date.now()}`),
        article: generateArticleNumber(),
        categoryId: defaultCategory.id,
        providerId,
        pricePair: priceWithMarkup, // Selling price with 30% markup
        buyPrice: originalPrice, // Store original price from Telegram
        currency: 'RUB',
        description: description.substring(0, 2000),
        source: 'TG' as ProductSource,
        measurementUnit: 'PIECES',
        sourceMessageIds: group.messageIds,
        isActive: false,
        batchProcessingStatus: 'pending', // Will be updated after GROQ analysis
      },
    });

    // Upload images to S3
    // Use TELEGRAM_CHANNEL_ID directly (it's the channel we're parsing from)
    const channelId = env.TELEGRAM_CHANNEL_ID || '';

    logger.debug(
      `📤 Uploading ${group.images.length} images to S3 for product ${product.id}...`
    );
    const uploadedImages = await this.uploadTelegramImagesToS3(
      product.id,
      group.images,
      channelId
    );

    if (uploadedImages.length === 0) {
      logger.debug(
        `⚠️ No images uploaded for product ${product.id}, deleting product`
      );
      await this.prisma.product.delete({ where: { id: product.id } });
      throw new Error('No images could be uploaded to S3');
    }

    // Create product images with S3 URLs
    for (let i = 0; i < uploadedImages.length; i++) {
      const uploaded = uploadedImages[i];
      await this.prisma.productImage.create({
        data: {
          productId: product.id,
          url: uploaded.url,
          key: uploaded.key,
          sort: i,
          isPrimary: i === 0,
          color: 'разноцветный',
          isActive: true,
        },
      });
    }

    // Use GROQ to analyze product
    try {
      logger.debug(`🤖 Analyzing product ${product.id} with GROQ...`);
      await this.analyzeTelegramProductWithGroq(
        product.id,
        group.messageIds,
        group.text,
        uploadedImages.map(img => img.url)
      );
    } catch (error) {
      logServerError(`❌ GROQ analysis failed for product ${product.id}:`, error);
      // Activate product even if GROQ fails (it has images and basic info)
      await this.prisma.product.update({
        where: { id: product.id },
        data: {
          isActive: true,
          batchProcessingStatus: 'completed',
        },
      });
      logger.debug(`✅ Product ${product.id} activated despite GROQ failure`);
    }

    // Mark messages as processed
    await this.prisma.telegramMessage.updateMany({
      where: { id: { in: group.messageIds } },
      data: { processed: true },
    });

    logger.debug(
      `✅ Created product ${product.id} from ${group.messageIds.length} messages`
    );
    return product.id;
  }

  /**
   * Parse messages from Telegram channel
   */
  async parseChannelMessages(hoursBack: number = 48): Promise<{
    messagesRead: number;
    productsCreated: number;
  }> {
    logger.debug(`[Telegram Parser] Starting parse (last ${hoursBack} hours)`);

    if (!env.TELEGRAM_CHANNEL_ID) {
      throw new Error('TELEGRAM_CHANNEL_ID is not configured');
    }

    // Fetch messages from Telegram
    // Use MTProto (user account) if credentials are available, otherwise use Bot API
    let telegramMessages: any[] = [];

    if (env.TELEGRAM_API_ID && env.TELEGRAM_API_HASH && env.TELEGRAM_PHONE) {
      logger.debug(
        '[Telegram Parser] Using MTProto (user account) to fetch messages'
      );
      try {
        await telegramMTProtoFetcher.connect();
        const mtprotoMessages =
          await telegramMTProtoFetcher.fetchChannelMessages(
            env.TELEGRAM_CHANNEL_ID,
            hoursBack
          );
        telegramMessages = mtprotoMessages;
        await telegramMTProtoFetcher.disconnect();
      } catch (error) {
        logServerError('[Telegram Parser] MTProto fetch failed, falling back to Bot API:', error);
        // Fall back to Bot API
        telegramMessages = await telegramFetcher.fetchChannelMessagesByUsername(
          env.TELEGRAM_CHANNEL_ID,
          hoursBack
        );
      }
    } else {
      logger.debug('[Telegram Parser] Using Bot API to fetch messages');
      telegramMessages = await telegramFetcher.fetchChannelMessagesByUsername(
        env.TELEGRAM_CHANNEL_ID,
        hoursBack
      );
    }

    if (telegramMessages.length === 0) {
      logger.debug('[Telegram Parser] No messages found');
      return { messagesRead: 0, productsCreated: 0 };
    }

    // Save messages to database
    const savedMessages: Array<{
      id: string;
      tgMessageId: number | bigint;
      tgMessageIdBigInt?: bigint; // Store for re-downloading images
      fromId: number | null;
      fromUsername: string | null;
      fromFirstName: string | null;
      text: string | null;
      caption: string | null;
      mediaUrl: string | null;
      type: string | null;
      date: number;
    }> = [];

    for (const msg of telegramMessages) {
      // Check if message already exists (convert to BigInt for lookup)
      const existing = await this.prisma.telegramMessage.findUnique({
        where: { tgMessageId: BigInt(msg.message_id) },
      });

      if (existing) {
        // Use existing message - use createdAt for date to maintain chronological order
        // createdAt reflects when the message was received/saved, which should match Telegram order
        savedMessages.push({
          id: existing.id,
          tgMessageId: existing.tgMessageId,
          fromId: existing.fromId ? Number(existing.fromId) : null,
          fromUsername: existing.fromUsername,
          fromFirstName: existing.fromFirstName,
          text: existing.text,
          caption: existing.caption,
          mediaUrl: existing.mediaUrl,
          type: existing.type,
          date: existing.createdAt.getTime() / 1000,
        });
        continue;
      }

      // Determine message type first
      let messageType = (msg as any).type;
      if (!messageType) {
        if (msg.photo && msg.photo.length > 0) {
          messageType = 'photo';
        } else if (msg.document) {
          messageType = 'document';
        } else if (msg.text || msg.caption) {
          messageType = 'text';
        } else {
          messageType = 'text';
        }
      }

      // Get media URL and buffer if it's a photo
      let mediaUrl: string | null = null;
      let mediaBuffer: Buffer | undefined = undefined;

      // If mediaBuffer is available (from MTProto download), use it
      if (
        (msg as any).mediaBuffer &&
        Buffer.isBuffer((msg as any).mediaBuffer)
      ) {
        mediaBuffer = (msg as any).mediaBuffer;
        mediaUrl = `telegram_photo_${msg.message_id}`; // Placeholder, will be replaced with S3 URL
      } else if ((msg as any).mediaUrl) {
        // If mediaUrl is already set (from MTProto), use it
        mediaUrl = (msg as any).mediaUrl;
      } else if (msg.photo && msg.photo.length > 0) {
        // Otherwise try to get from Bot API
        const largestPhoto = msg.photo[msg.photo.length - 1];
        mediaUrl = await telegramFetcher.getFileUrl(largestPhoto.file_id);
      } else if (messageType === 'photo') {
        // If it's a photo type but no mediaUrl, create a placeholder
        mediaUrl = `telegram_photo_${msg.message_id}`;
      }

      // Use the actual Telegram message date, not the database createdAt
      const messageDate =
        (msg as any).date || msg.date || Math.floor(Date.now() / 1000);

      // Save message to database
      const saved = await this.prisma.telegramMessage.create({
        data: {
          tgMessageId: BigInt(msg.message_id),
          chatId: msg.chat.id.toString(),
          fromId: msg.from?.id ? BigInt(msg.from.id) : null,
          fromUsername: msg.from?.username || null,
          fromFirstName: msg.from?.first_name || null,
          fromLastName: msg.from?.last_name || null,
          type: messageType,
          text: msg.text || null,
          caption: msg.caption || null,
          mediaUrl: mediaUrl || null,
          mediaFileId: msg.photo?.[0]?.file_id || msg.document?.file_id || null,
          mediaWidth: msg.photo?.[0]?.width || null,
          mediaHeight: msg.photo?.[0]?.height || null,
          mediaMimeType: msg.document?.mime_type || null,
          mediaFileSize: msg.document?.file_size || null,
          rawPayload: msg as any,
          date: BigInt(Math.floor(messageDate)),
        },
      });

      savedMessages.push({
        id: saved.id,
        tgMessageId: saved.tgMessageId,
        fromId: saved.fromId ? Number(saved.fromId) : null,
        fromUsername: saved.fromUsername,
        fromFirstName: saved.fromFirstName,
        text: saved.text,
        caption: saved.caption,
        mediaUrl: saved.mediaUrl,
        type: saved.type,
        date: messageDate,
        tgMessageIdBigInt: saved.tgMessageId, // Store for re-downloading images
      });
    }

    logger.debug(`[Telegram Parser] Saved ${savedMessages.length} messages`);

    // Check which messages are already processed
    const processedIds = await this.prisma.telegramMessage.findMany({
      where: {
        id: { in: savedMessages.map(m => m.id) },
        processed: true,
      },
      select: { id: true },
    });

    const processedIdSet = new Set(processedIds.map(m => m.id));
    const messagesToProcess = savedMessages.filter(
      msg => !processedIdSet.has(msg.id)
    );

    if (messagesToProcess.length === 0) {
      logger.debug('[Telegram Parser] No unprocessed messages found');
      return { messagesRead: savedMessages.length, productsCreated: 0 };
    }

    // Sort messages by date (chronological order) before grouping
    // This ensures messages are processed in the correct order
    messagesToProcess.sort((a, b) => a.date - b.date);

    logger.debug(
      `[Telegram Parser] Messages sorted by date. First message date: ${new Date(messagesToProcess[0]?.date * 1000).toISOString()}, Last: ${new Date(messagesToProcess[messagesToProcess.length - 1]?.date * 1000).toISOString()}`
    );

    // Debug: Log message types
    logger.debug(
      `[Telegram Parser] Analyzing ${messagesToProcess.length} messages for grouping...`
    );
    const messageTypes = messagesToProcess.map(msg => ({
      id: msg.id,
      hasText: !!(msg.text || msg.caption),
      hasImage: !!(msg.mediaUrl && msg.type === 'photo'),
      type: msg.type,
      author: msg.fromUsername || msg.fromId,
    }));
    logger.debug(
      {
        withText: messageTypes.filter(m => m.hasText).length,
        withImage: messageTypes.filter(m => m.hasImage).length,
        withBoth: messageTypes.filter(m => m.hasText && m.hasImage).length,
        withNeither: messageTypes.filter(m => !m.hasText && !m.hasImage).length,
      },
      '[Telegram Parser] Message breakdown'
    );

    // Group messages
    const groups = this.groupMessages(messagesToProcess);
    logger.debug(`[Telegram Parser] Created ${groups.length} message groups`);

    if (groups.length === 0 && messagesToProcess.length > 0) {
      logger.debug(
        `[Telegram Parser] ⚠️  No groups created. This usually means:`
      );
      logger.debug(
        `   - Messages don't have both images AND text from the same author`
      );
      logger.debug(`   - Messages are too far apart in time (>60 seconds)`);
      logger.debug(`   - Messages are from different authors`);
    }

    // Process each group
    let productsCreated = 0;
    for (const group of groups) {
      try {
        // Extract data from message text
        const location = this.extractLocation(group.text);
        const { price, boxPrice, amount } = this.parsePriceAndAmount(
          group.text
        );

        // Get or create provider
        const providerId = await this.getOrCreateProvider(
          group.authorId,
          group.authorUsername,
          location
        );

        // Create product
        await this.createProductFromGroup(
          group,
          {
            location,
            price,
            boxPrice,
            amount,
            description: group.text,
          },
          providerId
        );

        productsCreated++;
      } catch (error) {
        logServerError(`[Telegram Parser] Error processing group:`, error);
      }
    }

    logger.debug(
      `[Telegram Parser] Completed: ${savedMessages.length} messages read, ${productsCreated} products created`
    );

    return {
      messagesRead: savedMessages.length,
      productsCreated,
    };
  }
}
