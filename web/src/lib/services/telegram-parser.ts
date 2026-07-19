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
  /** Backfill window in months (default used by backfill script: 6). */
  monthsBack?: number;
  /** @deprecated Use monthsBack. Treated as monthsBack=6. */
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
  /**
   * One Telegram post = one product.
   * - Album (same groupedId): merge only those media parts
   * - Single message with media + caption: one product
   * Never glue neighboring posts by time/author.
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
      tgMessageIdBigInt?: bigint;
      groupedId?: string | null;
    }>
  ): TelegramMessageGroup[] {
    type Msg = (typeof messages)[0];
    const sorted = [...messages].sort((a, b) => {
      if (a.date !== b.date) return a.date - b.date;
      return Number(a.tgMessageId) - Number(b.tgMessageId);
    });

    const hasText = (msg: Msg) => !!(msg.text || msg.caption);
    const hasImage = (msg: Msg) =>
      (msg.type === 'photo' || msg.type === 'document') && !!msg.mediaUrl;

    const toImage = (msg: Msg) => {
      const tgMessageId = msg.tgMessageIdBigInt || (msg as any).tgMessageId;
      return {
        url: msg.mediaUrl || `telegram_photo_${msg.id}`,
        fileId: msg.mediaUrl || undefined,
        buffer: (msg as any).mediaBuffer as Buffer | undefined,
        tgMessageId: tgMessageId ? BigInt(tgMessageId.toString()) : undefined,
      };
    };

    const buildGroup = (parts: Msg[]): TelegramMessageGroup | null => {
      const images = parts.filter(hasImage).map(toImage);
      const textParts = parts
        .map(m => m.text || m.caption || '')
        .filter(Boolean);
      // Prefer the longest caption (album caption is usually on one part)
      const text = textParts.sort((a, b) => b.length - a.length)[0] || '';
      if (images.length === 0 || !text) return null;

      const head = parts[0];
      return {
        messageIds: parts.map(m => m.id),
        text,
        images,
        authorId: head.fromId,
        authorUsername: head.fromUsername,
        authorName: head.fromFirstName || head.fromUsername || 'Unknown',
        timestamp: head.date,
      };
    };

    const used = new Set<string>();
    const groups: TelegramMessageGroup[] = [];

    // 1) Albums: only messages that share Telegram groupedId
    const albums = new Map<string, Msg[]>();
    for (const msg of sorted) {
      if (!msg.groupedId) continue;
      const list = albums.get(msg.groupedId) || [];
      list.push(msg);
      albums.set(msg.groupedId, list);
    }

    for (const albumMsgs of albums.values()) {
      albumMsgs.forEach(m => used.add(m.id));
      const group = buildGroup(albumMsgs);
      if (group) groups.push(group);
    }

    // 2) Standalone posts: media + text in the SAME message only
    for (const msg of sorted) {
      if (used.has(msg.id)) continue;
      if (!hasImage(msg) || !hasText(msg)) continue;
      const group = buildGroup([msg]);
      if (group) {
        groups.push(group);
        used.add(msg.id);
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
      if (!channelId) {
        logger.error(
          `❌ No channel ID available for downloading message ${tgMessageId}`
        );
        return null;
      }

      return await telegramMTProtoFetcher.downloadMediaByMessageId(
        channelId,
        Number(tgMessageId)
      );
    } catch (error) {
      logServerError(
        `❌ Error downloading image for message ${tgMessageId}:`,
        error
      );
      return null;
    }
  }

  private isTelegramPlaceholderUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    return (
      url.startsWith('telegram_photo_') || url.startsWith('telegram_document_')
    );
  }

  /** Download media buffers for one product group right before create. */
  private async downloadGroupMedia(
    group: TelegramMessageGroup,
    chatId: string
  ): Promise<void> {
    for (let i = 0; i < group.images.length; i++) {
      const image = group.images[i];
      if (image.buffer && Buffer.isBuffer(image.buffer)) continue;

      const tgMessageId = image.tgMessageId;
      if (!tgMessageId) {
        console.log(
          `  ⚠️ Image ${i + 1}/${group.images.length}: no tgMessageId, skip download`
        );
        continue;
      }

      console.log(
        `  📥 Image ${i + 1}/${group.images.length}: downloading message ${tgMessageId}...`
      );
      const buffer = await this.downloadTelegramImageByMessageId(
        tgMessageId,
        chatId
      );
      if (buffer) {
        image.buffer = buffer;
        console.log(
          `  ✅ Image ${i + 1}/${group.images.length}: ${buffer.length} bytes`
        );
      } else {
        console.log(
          `  ⚠️ Image ${i + 1}/${group.images.length}: download failed`
        );
      }
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
          imageBuffer = image.buffer;
        } else if (image.url && !this.isTelegramPlaceholderUrl(image.url)) {
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
          this.isTelegramPlaceholderUrl(image.url) &&
          image.tgMessageId &&
          chatId
        ) {
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
  private extractGroupedId(msgOrPayload: any): string | null {
    if (!msgOrPayload) return null;
    const raw =
      msgOrPayload.groupedId ??
      msgOrPayload.grouped_id ??
      (msgOrPayload as any)?.rawPayload?.groupedId;
    if (raw == null || raw === '') return null;
    return String(raw);
  }

  private async upsertTelegramMessage(
    msg: any,
    channel: TelegramChannelConfig,
    chatId: string
  ): Promise<{
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
    processed: boolean;
    groupedId: string | null;
  }> {
    const tgMessageId = BigInt(msg.message_id);
    const incomingGroupedId = this.extractGroupedId(msg);

    let existing = await this.prisma.telegramMessage.findUnique({
      where: {
        chatId_tgMessageId: { chatId, tgMessageId },
      },
    });

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
      const raw = existing.rawPayload as any;
      // Refresh groupedId in rawPayload if we now know it
      if (incomingGroupedId && !this.extractGroupedId(raw)) {
        await this.prisma.telegramMessage.update({
          where: { id: existing.id },
          data: {
            rawPayload: { ...(raw || {}), groupedId: incomingGroupedId },
          },
        });
      }
      return {
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
        processed: existing.processed,
        groupedId: incomingGroupedId || this.extractGroupedId(raw) || null,
      };
    }

    let messageType = (msg as any).type;
    if (!messageType) {
      if (msg.photo && msg.photo.length > 0) {
        messageType = 'photo';
      } else if (msg.document) {
        messageType = 'document';
      } else {
        messageType = 'text';
      }
    }

    let mediaUrl: string | null = null;
    if ((msg as any).mediaUrl) {
      mediaUrl = (msg as any).mediaUrl;
    } else if (msg.photo && msg.photo.length > 0) {
      const largestPhoto = msg.photo[msg.photo.length - 1];
      // Bot API file_id — only when it looks like a real file_id
      if (
        largestPhoto.file_id &&
        !String(largestPhoto.file_id).startsWith('photo_')
      ) {
        mediaUrl = await telegramFetcher.getFileUrl(largestPhoto.file_id);
      } else {
        mediaUrl = `telegram_photo_${msg.message_id}`;
      }
    } else if (messageType === 'photo') {
      mediaUrl = `telegram_photo_${msg.message_id}`;
    } else if (messageType === 'document') {
      mediaUrl = `telegram_document_${msg.message_id}`;
    }

    const messageDate =
      (msg as any).date || msg.date || Math.floor(Date.now() / 1000);

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

    return {
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
      processed: saved.processed,
      groupedId: incomingGroupedId,
    };
  }

  /**
   * Parse one configured Telegram channel.
   * Flow: list metadata → group posts → for each post: download media → create product → next.
   */
  async parseChannel(
    channel: TelegramChannelConfig,
    options: ParseChannelOptions = {}
  ): Promise<{
    messagesRead: number;
    productsCreated: number;
  }> {
    const hoursBack = options.hoursBack ?? 48;
    const monthsBack = options.monthsBack ?? (options.fetchAll ? 6 : undefined);
    const chatId = normalizeChannelId(channel.id);
    const useMtproto = !!(
      env.TELEGRAM_API_ID &&
      env.TELEGRAM_API_HASH &&
      env.TELEGRAM_PHONE
    );

    console.log(
      monthsBack != null
        ? `[Telegram Parser] Parse ${chatId} (${channel.profile}, last ${monthsBack} months) — one post = one product`
        : `[Telegram Parser] Parse ${chatId} (${channel.profile}, last ${hoursBack}h) — one post = one product`
    );

    type SavedMsg = Awaited<ReturnType<typeof this.upsertTelegramMessage>>;
    const savedMessages: SavedMsg[] = [];
    let mtprotoConnected = false;

    try {
      if (useMtproto) {
        try {
          await telegramMTProtoFetcher.connect();
          mtprotoConnected = true;

          for await (const batch of telegramMTProtoFetcher.iterateChannelMessageBatches(
            chatId,
            monthsBack != null ? { monthsBack } : hoursBack
          )) {
            for (const msg of batch) {
              const saved = await this.upsertTelegramMessage(
                msg,
                channel,
                chatId
              );
              savedMessages.push(saved);
            }
          }
        } catch (error) {
          logServerError(
            '[Telegram Parser] MTProto fetch failed, falling back to Bot API:',
            error
          );
          if (monthsBack != null) throw error;

          const botMessages =
            await telegramFetcher.fetchChannelMessagesByUsername(
              chatId,
              hoursBack
            );
          for (const msg of botMessages) {
            savedMessages.push(
              await this.upsertTelegramMessage(msg, channel, chatId)
            );
          }
        }
      } else {
        if (monthsBack != null) {
          throw new Error(
            'Months-back backfill requires MTProto credentials (TELEGRAM_API_ID/HASH/PHONE)'
          );
        }
        const botMessages =
          await telegramFetcher.fetchChannelMessagesByUsername(
            chatId,
            hoursBack
          );
        for (const msg of botMessages) {
          savedMessages.push(
            await this.upsertTelegramMessage(msg, channel, chatId)
          );
        }
      }

      if (savedMessages.length === 0) {
        console.log(`[Telegram Parser] No messages found for ${chatId}`);
        return { messagesRead: 0, productsCreated: 0 };
      }

      const messagesToProcess = savedMessages.filter(msg => !msg.processed);
      console.log(
        `[Telegram Parser] ${savedMessages.length} messages listed, ${messagesToProcess.length} unprocessed`
      );

      if (messagesToProcess.length === 0) {
        return { messagesRead: savedMessages.length, productsCreated: 0 };
      }

      messagesToProcess.sort((a, b) => a.date - b.date);
      const groups = this.groupMessages(messagesToProcess);
      console.log(
        `[Telegram Parser] ${groups.length} product posts to process sequentially`
      );

      if (groups.length === 0 && messagesToProcess.length > 0) {
        console.log(
          `[Telegram Parser] ⚠️ No groups (need image+text within 60s, same author)`
        );
      }

      // Keep MTProto connected while we download media per post
      if (useMtproto && !mtprotoConnected) {
        await telegramMTProtoFetcher.connect();
        mtprotoConnected = true;
      }

      let productsCreated = 0;
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const preview = group.text.replace(/\s+/g, ' ').slice(0, 80);
        console.log(
          `\n[${i + 1}/${groups.length}] Post (${group.images.length} img): ${preview}...`
        );

        try {
          console.log(`  → downloading media...`);
          await this.downloadGroupMedia(group, chatId);

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

          console.log(`  → creating product (price=${price ?? 'n/a'})...`);
          const productId = await this.createProductFromGroup(
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
          console.log(`  ✅ [${i + 1}/${groups.length}] product ${productId}`);
        } catch (error) {
          console.error(
            `  ❌ [${i + 1}/${groups.length}] failed:`,
            error instanceof Error ? error.message : error
          );
          logServerError(`[Telegram Parser] Error processing group:`, error);
        }
      }

      console.log(
        `\n[Telegram Parser] Done ${chatId}: ${savedMessages.length} messages, ${productsCreated}/${groups.length} products created`
      );

      return {
        messagesRead: savedMessages.length,
        productsCreated,
      };
    } finally {
      if (mtprotoConnected) {
        await telegramMTProtoFetcher.disconnect();
      }
    }
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
