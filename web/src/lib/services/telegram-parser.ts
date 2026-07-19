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
import { logger, logServerError } from '@/lib/server/logger';
import {
  getTelegramChannels,
  normalizeChannelId,
  type TelegramChannelConfig,
  type TelegramParserProfile,
} from '../telegram-channels';

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

export interface ParseChannelOptions {
  hoursBack?: number;
  /** When true, fetch entire channel history (backfill). */
  fetchAll?: boolean;
}

export class TelegramParser {
  constructor(private prisma: PrismaClient) {}

  /**
   * Extract location from message text (profile-aware).
   */
  private extractLocation(
    text: string,
    profile: TelegramParserProfile
  ): string | null {
    if (profile === 'cosmetics') {
      const parts: string[] = [];
      const sadovod = text.match(/(?:ТК\s*)?САДОВОД|Садовод/i);
      if (sadovod) parts.push('ТК Садовод');
      const corpus = text.match(/Корпус\s*([^\n✅]+)/i);
      if (corpus) parts.push(`Корпус ${corpus[1].trim()}`);
      const line = text.match(
        /(\d+\s*Линя[^\n✅]*|Линия\s*[^\n✅]+|линия\s*[^\n✅]+)/i
      );
      if (line) parts.push(line[1].trim());
      const place = text.match(/место\s*([^\n✅]+)/i);
      if (place && !line?.[0]?.toLowerCase().includes('место')) {
        parts.push(`место ${place[1].trim()}`);
      }
      return parts.length > 0 ? parts.join(', ') : null;
    }

    // Flowers / default: "Линия 32-61/63 павильон"
    const locationPattern =
      /(?:Линия|линия|Павильон|павильон|Ряд|ряд)\s*([^\n]+)/i;
    const match = text.match(locationPattern);
    if (match) {
      return match[1].trim();
    }
    return null;
  }

  /**
   * Parse price and amount from message text (profile-aware).
   * Flowers: "180₽×20шт＝3600Руб."
   * Cosmetics: "цена :ряд 4 шт 360" → amount=4, boxPrice=360, unit price=90
   */
  private parsePriceAndAmount(
    text: string,
    profile: TelegramParserProfile
  ): {
    price: number | null;
    boxPrice: number | null;
    amount: number | null;
  } {
    if (profile === 'cosmetics') {
      // "цена :ряд 4 шт 360" / "Цена:ряд 2 шт 260 рубль"
      const rowPattern = /ряд\s*(\d+)\s*шт\s*(\d+)/i;
      const rowMatch = text.match(rowPattern);
      if (rowMatch) {
        const amount = parseInt(rowMatch[1], 10);
        const boxPrice = parseInt(rowMatch[2], 10);
        const price = amount > 0 ? Math.round(boxPrice / amount) : boxPrice;
        return { price, boxPrice, amount };
      }
      const priceOnly = text.match(/(?:цена|price)\s*[:：]?\s*(\d+)/i);
      if (priceOnly) {
        return {
          price: parseInt(priceOnly[1], 10),
          boxPrice: null,
          amount: 1,
        };
      }
      return { price: null, boxPrice: null, amount: null };
    }

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
      const channel = channelId || env.TELEGRAM_CHANNEL_ID;
      if (!channel) {
        logger.error(
          `❌ No channel ID available for downloading message ${tgMessageId}`
        );
        return null;
      }

      const buffer = await telegramMTProtoFetcher.downloadMediaByMessageId(
        channel,
        Number(tgMessageId)
      );
      return buffer;
    } catch (error) {
      logServerError(
        `❌ Error downloading image for message ${tgMessageId}:`,
        error
      );
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
    imageUrls: string[],
    profile: TelegramParserProfile
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

      let systemPrompt: string;
      let userPrompt: string;
      let defaultName: string;

      if (profile === 'cosmetics') {
        const {
          TELEGRAM_COSMETICS_ANALYSIS_SYSTEM_PROMPT,
          TELEGRAM_COSMETICS_ANALYSIS_USER_PROMPT,
        } = await import('../prompts/telegram-cosmetics-analysis-prompts');
        systemPrompt = TELEGRAM_COSMETICS_ANALYSIS_SYSTEM_PROMPT;
        userPrompt = TELEGRAM_COSMETICS_ANALYSIS_USER_PROMPT(
          textContent,
          imageUrls.length
        );
        defaultName = 'Косметика';
      } else {
        const {
          TELEGRAM_FLOWER_ANALYSIS_SYSTEM_PROMPT,
          TELEGRAM_FLOWER_ANALYSIS_USER_PROMPT,
        } = await import('../prompts/telegram-flower-analysis-prompts');
        systemPrompt = TELEGRAM_FLOWER_ANALYSIS_SYSTEM_PROMPT;
        userPrompt = TELEGRAM_FLOWER_ANALYSIS_USER_PROMPT(
          textContent,
          imageUrls.length
        );
        defaultName = 'Искусственные цветы';
      }

      const groqConfig = await getGroqConfig();
      const groq = new Groq(groqConfig);

      const response = await groqChatCompletion(
        groq,
        {
          model: process.env.GROQ_TEXT_MODEL || 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userPrompt,
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
        name: analysisResult.name || defaultName,
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
  private async resolveCategory(profile: TelegramParserProfile) {
    if (profile === 'cosmetics') {
      // Prefer dedicated beauty category. Do NOT match «Автокосметика» via substring «космет».
      let category = await this.prisma.category.findFirst({
        where: {
          OR: [
            { slug: 'cosmetics' },
            { slug: 'kosmetika' },
            { name: { equals: 'Косметика', mode: 'insensitive' } },
          ],
        },
      });
      if (!category) {
        category = await this.prisma.category.findFirst({
          where: {
            AND: [
              {
                OR: [
                  { name: { contains: 'космет', mode: 'insensitive' } },
                  { slug: { contains: 'cosmet', mode: 'insensitive' } },
                  { slug: { contains: 'kosmet', mode: 'insensitive' } },
                ],
              },
              {
                NOT: {
                  OR: [
                    { name: { contains: 'авто', mode: 'insensitive' } },
                    { slug: { contains: 'avto', mode: 'insensitive' } },
                    { slug: { contains: 'auto', mode: 'insensitive' } },
                    { path: { contains: 'avto', mode: 'insensitive' } },
                    { path: { contains: 'auto', mode: 'insensitive' } },
                  ],
                },
              },
            ],
          },
        });
      }
      if (!category) {
        category = await this.prisma.category.create({
          data: {
            name: 'Косметика',
            slug: 'cosmetics',
            path: 'cosmetics',
            isActive: true,
            sort: 100,
          },
        });
      }
      return category;
    }

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

    return defaultCategory;
  }

  private async createProductFromGroup(
    group: TelegramMessageGroup,
    parsedData: ParsedProductData,
    providerId: string,
    channel: TelegramChannelConfig
  ): Promise<string> {
    const { price, description } = parsedData;
    const defaultCategory = await this.resolveCategory(channel.profile);

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

    const channelId = channel.id;

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
        uploadedImages.map(img => img.url),
        channel.profile
      );
    } catch (error) {
      logServerError(
        `❌ GROQ analysis failed for product ${product.id}:`,
        error
      );
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
   * Parse one configured Telegram channel (incremental or full history).
   */
  async parseChannel(
    channel: TelegramChannelConfig,
    options: ParseChannelOptions = {}
  ): Promise<{
    messagesRead: number;
    productsCreated: number;
  }> {
    const hoursBack = options.hoursBack ?? 48;
    const fetchAll = options.fetchAll ?? false;
    const chatId = normalizeChannelId(channel.id);

    logger.debug(
      fetchAll
        ? `[Telegram Parser] Starting FULL parse for ${chatId} (${channel.profile})`
        : `[Telegram Parser] Starting parse for ${chatId} (${channel.profile}, last ${hoursBack} hours)`
    );

    let telegramMessages: any[] = [];

    if (env.TELEGRAM_API_ID && env.TELEGRAM_API_HASH && env.TELEGRAM_PHONE) {
      logger.debug(
        '[Telegram Parser] Using MTProto (user account) to fetch messages'
      );
      try {
        await telegramMTProtoFetcher.connect();
        telegramMessages = await telegramMTProtoFetcher.fetchChannelMessages(
          chatId,
          fetchAll ? { fetchAll: true } : hoursBack
        );
        await telegramMTProtoFetcher.disconnect();
      } catch (error) {
        logServerError(
          '[Telegram Parser] MTProto fetch failed, falling back to Bot API:',
          error
        );
        if (fetchAll) {
          throw error;
        }
        telegramMessages = await telegramFetcher.fetchChannelMessagesByUsername(
          chatId,
          hoursBack
        );
      }
    } else {
      if (fetchAll) {
        throw new Error(
          'Full history backfill requires MTProto credentials (TELEGRAM_API_ID/HASH/PHONE)'
        );
      }
      logger.debug('[Telegram Parser] Using Bot API to fetch messages');
      telegramMessages = await telegramFetcher.fetchChannelMessagesByUsername(
        chatId,
        hoursBack
      );
    }

    if (telegramMessages.length === 0) {
      logger.debug(`[Telegram Parser] No messages found for ${chatId}`);
      return { messagesRead: 0, productsCreated: 0 };
    }

    const savedMessages: Array<{
      id: string;
      tgMessageId: number | bigint;
      tgMessageIdBigInt?: bigint;
      fromId: number | null;
      fromUsername: string | null;
      fromFirstName: string | null;
      text: string | null;
      caption: string | null;
      mediaUrl: string | null;
      type: string | null;
      date: number;
      mediaBuffer?: Buffer;
    }> = [];

    for (const msg of telegramMessages) {
      const tgMessageId = BigInt(msg.message_id);

      let existing = await this.prisma.telegramMessage.findUnique({
        where: {
          chatId_tgMessageId: { chatId, tgMessageId },
        },
      });

      // Legacy rows may use numeric chat id or 'legacy-tg' — adopt under normalized channel id
      if (!existing) {
        const numericChatId = msg.chat?.id != null ? String(msg.chat.id) : null;
        const legacyChatIds = [
          'legacy-tg',
          ...(numericChatId ? [numericChatId] : []),
        ];
        const legacy = await this.prisma.telegramMessage.findFirst({
          where: {
            tgMessageId,
            chatId: { in: legacyChatIds },
          },
        });
        if (legacy && legacy.chatId !== chatId) {
          existing = await this.prisma.telegramMessage.update({
            where: { id: legacy.id },
            data: { chatId },
          });
        } else if (legacy) {
          existing = legacy;
        }
      }

      if (existing) {
        const existingDate = existing.date
          ? Number(existing.date)
          : existing.createdAt.getTime() / 1000;
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
          date: existingDate,
          tgMessageIdBigInt: existing.tgMessageId,
        });
        continue;
      }

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

      let mediaUrl: string | null = null;
      let mediaBuffer: Buffer | undefined = undefined;

      if (
        (msg as any).mediaBuffer &&
        Buffer.isBuffer((msg as any).mediaBuffer)
      ) {
        mediaBuffer = (msg as any).mediaBuffer;
        mediaUrl = `telegram_photo_${msg.message_id}`;
      } else if ((msg as any).mediaUrl) {
        mediaUrl = (msg as any).mediaUrl;
      } else if (msg.photo && msg.photo.length > 0) {
        const largestPhoto = msg.photo[msg.photo.length - 1];
        mediaUrl = await telegramFetcher.getFileUrl(largestPhoto.file_id);
      } else if (messageType === 'photo') {
        mediaUrl = `telegram_photo_${msg.message_id}`;
      }

      const messageDate =
        (msg as any).date || msg.date || Math.floor(Date.now() / 1000);

      // Prefer channel username as provider identity for channel posts
      const channelUsername = chatId.replace(/^@/, '');
      const fromUsername = msg.from?.username || channelUsername || null;
      const fromFirstName =
        msg.from?.first_name || channel.name || channelUsername || null;

      const saved = await this.prisma.telegramMessage.create({
        data: {
          tgMessageId,
          chatId,
          fromId: msg.from?.id ? BigInt(msg.from.id) : null,
          fromUsername,
          fromFirstName,
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
        tgMessageIdBigInt: saved.tgMessageId,
        mediaBuffer,
      });
    }

    logger.debug(
      `[Telegram Parser] Saved ${savedMessages.length} messages for ${chatId}`
    );

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

    messagesToProcess.sort((a, b) => a.date - b.date);

    logger.debug(
      `[Telegram Parser] Analyzing ${messagesToProcess.length} messages for grouping...`
    );

    const groups = this.groupMessages(messagesToProcess);
    logger.debug(`[Telegram Parser] Created ${groups.length} message groups`);

    if (groups.length === 0 && messagesToProcess.length > 0) {
      logger.debug(
        `[Telegram Parser] ⚠️  No groups created. Usually: missing image+text pair, >60s gap, or different authors`
      );
    }

    let productsCreated = 0;
    for (const group of groups) {
      try {
        const location = this.extractLocation(group.text, channel.profile);
        const { price, boxPrice, amount } = this.parsePriceAndAmount(
          group.text,
          channel.profile
        );

        const providerUsername =
          group.authorUsername || chatId.replace(/^@/, '');
        const providerId = await this.getOrCreateProvider(
          group.authorId,
          providerUsername,
          location
        );

        await this.createProductFromGroup(
          group,
          {
            location,
            price,
            boxPrice,
            amount,
            description: group.text,
          },
          providerId,
          channel
        );

        productsCreated++;
      } catch (error) {
        logServerError(`[Telegram Parser] Error processing group:`, error);
      }
    }

    logger.debug(
      `[Telegram Parser] Completed ${chatId}: ${savedMessages.length} messages read, ${productsCreated} products created`
    );

    return {
      messagesRead: savedMessages.length,
      productsCreated,
    };
  }

  /**
   * Parse all configured Telegram channels (last N hours each).
   * Backward-compatible entry used by cron / test scripts.
   */
  async parseChannelMessages(hoursBack: number = 48): Promise<{
    messagesRead: number;
    productsCreated: number;
  }> {
    const channels = getTelegramChannels();
    if (channels.length === 0) {
      throw new Error(
        'No Telegram channels configured. Set TELEGRAM_CHANNELS or TELEGRAM_CHANNEL_ID'
      );
    }

    let messagesRead = 0;
    let productsCreated = 0;
    for (const channel of channels) {
      const result = await this.parseChannel(channel, { hoursBack });
      messagesRead += result.messagesRead;
      productsCreated += result.productsCreated;
    }
    return { messagesRead, productsCreated };
  }
}
