import Groq from 'groq-sdk';
import { PrismaClient } from '@prisma/client';
import { GroqGroupingService } from './groq-grouping-service';
import { SimpleProductService } from './simple-product-service';
import { AnalysisValidationService } from './analysis-validation-service';
import { FixedColorMappingService } from './fixed-color-mapping-service';
import { ParsingProgressService } from './parsing-progress-service';
import { getCategoryTree } from '../catalog-categories';
import { getGroqConfig } from '../groq-proxy-config';
import { uploadImage, getObjectKey, getPublicUrl } from '../storage';
import { withRetry } from '../../utils/retry';
import {
  TEXT_ANALYSIS_SYSTEM_PROMPT,
  TEXT_ANALYSIS_USER_PROMPT,
} from '../prompts/text-analysis-prompts';
import {
  IMAGE_ANALYSIS_SYSTEM_PROMPT,
  IMAGE_ANALYSIS_USER_PROMPT,
} from '../prompts/image-analysis-prompts';

export class GroqSequentialProcessor {
  private groq: Groq | null = null;
  private prisma: PrismaClient;
  private groupingService: GroqGroupingService;
  private batchProductService: SimpleProductService;
  private validationService: AnalysisValidationService;
  private colorMappingService: FixedColorMappingService;
  private progressService?: ParsingProgressService;

  constructor(
    prismaClient: PrismaClient,
    progressService?: ParsingProgressService
  ) {
    this.prisma = prismaClient;
    this.progressService = progressService;
    this.groupingService = new GroqGroupingService();
    this.batchProductService = new SimpleProductService();
    this.validationService = new AnalysisValidationService();
    this.colorMappingService = new FixedColorMappingService();
  }

  private async initializeGroq(): Promise<Groq> {
    if (!this.groq) {
      const config = await getGroqConfig();
      this.groq = new Groq(config);
    }
    return this.groq;
  }

  /**
   * Process messages sequentially: Group → Analysis → Colors
   */
  async processMessagesToProducts(messageIds: string[]): Promise<{
    anyProcessed: boolean;
    finalizedMessageIds: string[];
    productsCreated: number;
  }> {
    console.log(
      `🚀 Starting Groq sequential processing for ${messageIds.length} messages`
    );

    try {
      // Step 1: Group messages using Groq
      console.log('📊 Step 1: Grouping messages...');
      const groupingResult = await this.groupMessagesWithGroqDebug(messageIds);
      const groups = groupingResult.groups;
      const debugInfo = groupingResult.debugInfo;

      if (groups.length === 0) {
        console.log('❌ No valid message groups found');
        return {
          anyProcessed: false,
          finalizedMessageIds: [],
          productsCreated: 0,
        };
      }

      console.log(`✅ Found ${groups.length} message groups`);

      // Step 2: Process each group sequentially
      const processedProducts: string[] = [];

      for (const group of groups) {
        try {
          console.log(
            `🔄 Processing group ${group.groupId} with ${group.messageIds.length} messages`
          );

          // Trust LLM - if it created a group, it's valid
          // No manual validation - let LLM decide what constitutes a valid product
          console.log(
            `✅ Accepting LLM-created group ${group.groupId} (trusting LLM judgment)`
          );

          // Create inactive product
          const productResult =
            await this.batchProductService.createInactiveProduct({
              messageIds: group.messageIds,
              productContext: group.productContext,
              confidence: group.confidence,
              gptRequest: debugInfo?.request || null,
              gptResponse: debugInfo?.response || null,
            });

          // Skip processing if this is a dummy product ID (already processed)
          if (productResult.productId === 'skipped-already-processed') {
            console.log(
              `⚠️ Skipping processing for already processed messages in group ${group.groupId}`
            );
            continue;
          }

          // Each group gets its own product - no duplicate checking needed

          // Set a timeout for the entire processing pipeline
          const processingTimeout = 10 * 60 * 1000; // 10 minutes
          const startTime = Date.now();

          try {
            // Step 3: Analyze product with Groq
            console.log(
              `🔍 Step 2: Analyzing product ${productResult.productId}...`
            );
            await this.analyzeProductWithGroq(
              productResult.productId,
              group.messageIds
            );

            // Check timeout
            if (Date.now() - startTime > processingTimeout) {
              throw new Error('Processing timeout exceeded');
            }

            // Step 4: Upload images to S3
            console.log(
              `📤 Step 3: Uploading images to S3 for product ${productResult.productId}...`
            );
            await this.uploadImagesToS3(
              productResult.productId,
              group.messageIds
            );

            // Check timeout
            if (Date.now() - startTime > processingTimeout) {
              throw new Error('Processing timeout exceeded');
            }

            // Step 5: Detect colors with Groq
            console.log(
              `🎨 Step 4: Detecting colors for product ${productResult.productId}...`
            );
            await this.detectColorsWithGroq(
              productResult.productId,
              group.messageIds
            );

            // Check timeout
            if (Date.now() - startTime > processingTimeout) {
              throw new Error('Processing timeout exceeded');
            }

            // Trust LLM - activate product without validation
            // LLM has already validated the product structure
            console.log(
              `✅ Activating product ${productResult.productId} (trusting LLM analysis)...`
            );
            await this.batchProductService.activateProduct(
              productResult.productId
            );
          } catch (processingError) {
            console.error(
              `❌ Error processing product ${productResult.productId}:`,
              processingError instanceof Error
                ? processingError.message
                : JSON.stringify(processingError)
            );

            // Handle different error types appropriately
            const errorMessage =
              processingError instanceof Error
                ? processingError.message
                : String(processingError);

            if (errorMessage.includes('No valid content for analysis')) {
              console.log(
                `⚠️ Group has no valid content - marking messages as unprocessed for future grouping`
              );
              // Reset messages so they can be regrouped
              await this.prisma.whatsAppMessage.updateMany({
                where: { id: { in: group.messageIds } },
                data: {
                  processed: false,
                  draftProductId: null,
                },
              });
              // Delete the invalid product
              await this.deleteInvalidProduct(productResult.productId);
            } else if (errorMessage.includes('Product deleted: missing required data')) {
              console.log(
                `⚠️ Product deleted due to missing price/sizes - messages already reset for reprocessing`
              );
              // Product was already deleted and messages reset in updateProductWithAnalysis
              // No need to delete again, just log and continue
            } else {
              console.log(
                `🗑️ Cleaning up failed product ${productResult.productId}...`
              );
              // Clean up the failed product
              await this.deleteInvalidProduct(productResult.productId);
            }
            throw processingError; // Re-throw to be caught by outer try-catch
          }

          processedProducts.push(productResult.productId);
          console.log(
            `✅ Successfully processed product ${productResult.productId}`
          );
        } catch (error) {
          console.error(`❌ Error processing group ${group.groupId}:`, error);
          console.log(`⚠️ Continuing with next group...`);
        }
      }

      console.log(
        `🎉 Sequential processing completed: ${processedProducts.length} products processed`
      );
      return {
        anyProcessed: true,
        finalizedMessageIds: messageIds,
        productsCreated: processedProducts.length,
      };
    } catch (error) {
      console.error('❌ Error in sequential processing:', error);
      return {
        anyProcessed: false,
        finalizedMessageIds: [],
        productsCreated: 0,
      };
    }
  }

  /**
   * Group messages using Groq
   */
  private async groupMessagesWithGroq(messageIds: string[]): Promise<any[]> {
    const messages = await this.prisma.whatsAppMessage.findMany({
      where: { id: { in: messageIds } },
      orderBy: { createdAt: 'asc' },
    });

    if (messages.length === 0) return [];

    // Prepare messages for grouping
    const messagesForGrouping = messages.map((msg: any) => ({
      id: msg.id,
      text: msg.text,
      type: msg.type,
      createdAt: msg.createdAt,
      senderId: msg.providerId,
      mediaUrl: msg.mediaUrl || null, // Include mediaUrl so LLM can identify image messages
    }));

    // Use existing grouping service but with Groq
    return await this.groupingService.groupMessages(messagesForGrouping);
  }

  /**
   * Group messages using Groq with debug info
   */
  private async groupMessagesWithGroqDebug(messageIds: string[]): Promise<{
    groups: any[];
    debugInfo: any;
  }> {
    const messages = await this.prisma.whatsAppMessage.findMany({
      where: { id: { in: messageIds } },
      orderBy: { createdAt: 'asc' },
    });

    if (messages.length === 0) return { groups: [], debugInfo: null };

    // Prepare messages for grouping
    const messagesForGrouping = messages.map((msg: any) => ({
      id: msg.id,
      text: msg.text,
      type: msg.type,
      createdAt: msg.createdAt,
      senderId: msg.providerId,
      mediaUrl: msg.mediaUrl || null, // Include mediaUrl so LLM can identify image messages
    }));

    // Use existing grouping service but with Groq
    return await this.groupingService.groupMessagesWithDebug(
      messagesForGrouping
    );
  }

  /**
   * Validate product results after Groq processing
   */
  private async deleteInvalidProduct(productId: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting invalid product ${productId}...`);

      // Check if product exists first
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { id: true },
      });

      if (!product) {
        console.log(`⚠️ Product ${productId} not found, skipping deletion`);
        return;
      }

      // Delete associated images first
      const deletedImages = await this.prisma.productImage.deleteMany({
        where: { productId },
      });
      console.log(`✅ Deleted ${deletedImages.count} product images`);

      // Delete the product
      await this.prisma.product.delete({
        where: { id: productId },
      });
      console.log(`✅ Deleted invalid product ${productId}`);
    } catch (error) {
      console.error(`❌ Error deleting invalid product ${productId}:`, error);
    }
  }

  private async validateProductResults(productId: string): Promise<boolean> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: {
          name: true,
          description: true,
          pricePair: true,
          gender: true,
          season: true,
          sizes: true,
          material: true,
          images: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!product) {
        console.log(`❌ Product ${productId} not found`);
        return false;
      }

      // Check if product has essential data
      // Allow name to be "Processing..." since it will be updated by image analysis
      const hasName =
        product.name &&
        product.name.trim().length > 0 &&
        product.name !== 'Processing...' &&
        product.name !== 'Untitled Product';
      const hasDescription =
        product.description && product.description.trim().length > 0;
      const hasPrice = product.pricePair && product.pricePair.toNumber() > 0;
      const hasGender =
        product.gender && ['MALE', 'FEMALE'].includes(product.gender);
      const hasSeason =
        product.season &&
        ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'].includes(product.season);
      const hasSizes =
        product.sizes &&
        Array.isArray(product.sizes) &&
        (product.sizes as any[]).length > 0;
      const hasImages = product.images && product.images.length > 0;

      console.log(`🔍 Validating product ${productId}:`);
      console.log(
        `  Name: ${hasName ? '✅' : '⚠️'} (${product.name}) - Optional`
      );
      console.log(`  Description: ${hasDescription ? '✅' : '⚠️'} - Optional`);
      console.log(`  Price: ${hasPrice ? '✅' : '❌'} (${product.pricePair})`);
      console.log(`  Gender: ${hasGender ? '✅' : '❌'} (${product.gender})`);
      console.log(`  Season: ${hasSeason ? '✅' : '❌'} (${product.season})`);
      console.log(
        `  Sizes: ${hasSizes ? '✅' : '❌'} (${Array.isArray(product.sizes) ? (product.sizes as any[]).length : 0} sizes)`
      );
      console.log(
        `  Images: ${hasImages ? '✅' : '❌'} (${product.images.length} images)`
      );

      // Product is invalid if it has no images or missing essential data
      const isValid =
        hasPrice && hasGender && hasSeason && hasSizes && hasImages;
      console.log(
        `  Overall validation: ${isValid ? '✅ VALID' : '❌ INVALID'}`
      );

      return Boolean(isValid);
    } catch (error) {
      console.error(`❌ Error validating product ${productId}:`, error);
      return false;
    }
  }

  /**
   * Validate group has both image and text content
   */
  private async validateGroupContent(messageIds: string[]): Promise<boolean> {
    const messages = await this.prisma.whatsAppMessage.findMany({
      where: { id: { in: messageIds } },
      select: {
        type: true,
        text: true,
        mediaUrl: true,
      },
    });

    console.log(
      `🔍 Validating group content for ${messageIds.length} messages:`
    );
    messages.forEach((msg: any, index: number) => {
      console.log(
        `  Message ${index + 1}: type="${msg.type}", text="${msg.text?.substring(0, 50)}...", mediaUrl="${msg.mediaUrl ? 'YES' : 'NO'}"`
      );
    });

    // Check for text messages: textMessage, extendedTextMessage types are text messages
    // extendedTextMessage is a text message type - if the type is extendedTextMessage, it IS text
    // even if the text field is empty or minimal (the type itself indicates it's a text message)
    const hasText = messages.some((msg: any) => {
      // extendedTextMessage and textMessage are text message types by definition
      // If type is extendedTextMessage, it's a text message regardless of text field content
      if (msg.type === 'extendedTextMessage' || msg.type === 'textMessage') {
        // For extendedTextMessage, the type itself indicates it's text, but we still check text exists
        // Some extendedTextMessage may have text in rawPayload even if text field is empty
        return msg.text && typeof msg.text === 'string' && msg.text.trim().length > 0;
      }

      // For other types, check if they have text content
      return msg.text && typeof msg.text === 'string' && msg.text.trim().length > 0;
    });

    const hasImage = messages.some(
      (msg: any) =>
        msg.mediaUrl && (msg.type === 'image' || msg.type === 'imageMessage')
    );

    console.log(`  ✅ Has text: ${hasText}`);
    console.log(`  ✅ Has image: ${hasImage}`);

    // Basic content validation - only check for text and images
    // Author validation is left to LLM (it's instructed to group only same-author messages)
    if (!hasText || !hasImage) {
      console.log(`  ❌ Invalid group: missing text or images`);
      return false;
    }

    console.log(`  ✅ Valid group: has text, has image`);
    return true;
  }

  /**
   * Recover image-only groups by finding nearby text messages
   */
  private async recoverImageOnlyGroup(imageMessageIds: string[]): Promise<string[]> {
    // Get the image messages to find their timestamps and author
    const imageMessages = await this.prisma.whatsAppMessage.findMany({
      where: { id: { in: imageMessageIds } },
      select: {
        id: true,
        createdAt: true,
        from: true,
        providerId: true,
        chatId: true,
        type: true,
        mediaUrl: true,
        text: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (imageMessages.length === 0) return imageMessageIds;

    // Check if group is actually image-only
    const hasAnyText = imageMessages.some(
      (msg: any) =>
        (msg.type === 'textMessage' || msg.type === 'extendedTextMessage') &&
        msg.text
    );
    if (hasAnyText) return imageMessageIds; // Already has text, no recovery needed

    // Get time range (first and last image timestamps)
    const firstTimestamp = new Date(imageMessages[0].createdAt).getTime();
    const lastTimestamp = new Date(
      imageMessages[imageMessages.length - 1].createdAt
    ).getTime();

    // Get author (from first message)
    const author = imageMessages[0].providerId || imageMessages[0].from;
    if (!author) return imageMessageIds;

    // Search for text messages within 120 seconds before first image or after last image
    const searchWindowMs = 120 * 1000; // 120 seconds
    const searchStart = new Date(firstTimestamp - searchWindowMs);
    const searchEnd = new Date(lastTimestamp + searchWindowMs);

    console.log(
      `  🔍 Searching for text messages: ${searchStart.toISOString()} to ${searchEnd.toISOString()}`
    );

    // Find text messages from same author in the time window
    const textMessages = await this.prisma.whatsAppMessage.findMany({
      where: {
        chatId: imageMessages[0].chatId,
        id: { notIn: imageMessageIds }, // Don't include already grouped messages
        processed: false, // Only unprocessed messages
        type: { in: ['textMessage', 'extendedTextMessage'] },
        text: { not: null },
        OR: [
          { providerId: author },
          { from: author },
        ],
        createdAt: {
          gte: searchStart,
          lte: searchEnd,
        },
      },
      select: { id: true, text: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
      take: 5, // Limit to 5 closest text messages
    });

    if (textMessages.length === 0) {
      console.log(`  ❌ No text messages found for recovery`);
      return imageMessageIds;
    }

    // Filter to messages that actually have text content
    const validTextMessages = textMessages.filter(
      (msg: any) => msg.text && msg.text.trim().length > 0
    );

    if (validTextMessages.length === 0) {
      console.log(`  ❌ No valid text messages found for recovery`);
      return imageMessageIds;
    }

    console.log(
      `  ✅ Found ${validTextMessages.length} text messages for recovery`
    );

    // Return original image IDs + recovered text message IDs
    return [...imageMessageIds, ...validTextMessages.map((m: any) => m.id)];
  }

  /**
   * Validate sequence - relaxed to allow ITIIII patterns (2 changes) for same-author groups
   * This allows valid product patterns: Image → Text → Images (e.g., ITIIII)
   */
  private validateSequenceTypeChanges(messages: any[]): boolean {
    if (messages.length < 2) return true;

    // Sort messages by timestamp
    const sortedMessages = [...messages].sort(
      (a, b) =>
        new Date(a.createdAt || a.timestamp).getTime() -
        new Date(b.createdAt || b.timestamp).getTime()
    );

    // Check if all messages are from same author (relaxed rules for same author)
    const senderIds = sortedMessages
      .map(msg => msg.senderId || msg.from || msg.providerId)
      .filter(id => id && id !== 'unknown');
    const allSameAuthor = senderIds.length > 0 && new Set(senderIds).size === 1;

    // Create type sequence: 'T' for text, 'I' for image
    // extendedTextMessage and textMessage are text message types - explicitly recognize them
    const types = sortedMessages.map(msg => {
      // extendedTextMessage and textMessage are text message types
      // For these types, we check if text field exists and has content
      const isTextMessageType =
        msg.type === 'textMessage' || msg.type === 'extendedTextMessage';

      // Check if message has text content
      const hasText = msg.text && typeof msg.text === 'string' && msg.text.trim().length > 0;

      const hasImage =
        msg.mediaUrl && (msg.type === 'image' || msg.type === 'imageMessage');

      if (hasText && hasImage) return 'B'; // Both
      if (hasText) return 'T';
      if (hasImage) return 'I';
      return 'N'; // Neither
    });

    // Count type changes
    let typeChanges = 0;
    for (let i = 1; i < types.length; i++) {
      if (types[i] !== types[i - 1]) {
        typeChanges++;
      }
    }

    console.log(
      `  🔍 Sequence types: ${types.join('')}, changes: ${typeChanges}`
    );

    // Check if this is a common valid pattern (IT* or TI* patterns)
    // These are natural product sequences: Image → Text → Images or Text → Images → Text
    // Patterns like ITIII, ITII, TIIIIT, IIIITI are all valid 2-change sequences
    const sequenceStr = types.join('');
    const isCommonValidPattern =
      sequenceStr.startsWith('IT') || // Image → Text → Images (ITIII, ITII, etc.)
      sequenceStr.startsWith('TI') || // Text → Images → Text (TIIIIT, etc.)
      sequenceStr.includes('ITI') || // Contains Image → Text → Image anywhere
      sequenceStr.includes('TIT') || // Contains Text → Image → Text anywhere
      /^I+TI+$/.test(sequenceStr) || // Pattern: Images → Text → Images (IIIITI, IITII, etc.)
      /^T+IT+$/.test(sequenceStr); // Pattern: Text → Images → Text

    // Allow up to 2 type changes if:
    // 1. All messages from same author, OR
    // 2. It's a common valid pattern (ITIIII, TIIIT, etc.)
    // This handles cases where author detection fails but pattern is clearly valid
    const maxChanges =
      allSameAuthor || isCommonValidPattern ? 2 : 1;
    const isValid = typeChanges <= maxChanges;

    if (isValid && typeChanges === 2) {
      const reason = allSameAuthor
        ? 'same-author group'
        : isCommonValidPattern
          ? 'common valid pattern (IT*/TI*)'
          : '';
      console.log(
        `  ✅ Sequence validation: ${isValid} (allowed 2 changes for ${reason})`
      );
    } else {
      console.log(`  ${isValid ? '✅' : '❌'} Sequence validation: ${isValid}`);
    }

    return isValid;
  }

  /**
   * Analyze product using Groq
   */
  private async analyzeProductWithGroq(
    productId: string,
    messageIds: string[]
  ): Promise<void> {
    const messages = await this.prisma.whatsAppMessage.findMany({
      where: { id: { in: messageIds } },
      orderBy: { createdAt: 'asc' },
    });

    // Prepare text content
    const textContents = messages
      .map((m: any) => m.text)
      .filter(Boolean)
      .join('\n\n');

    // Prepare image URLs
    const imageUrls = messages
      .filter((m: any) => m.type === 'imageMessage' && m.mediaUrl)
      .map((m: any) => m.mediaUrl!);

    if (!textContents || imageUrls.length === 0) {
      const missingText = !textContents || textContents.trim().length === 0;
      const missingImages = imageUrls.length === 0;
      console.log(
        `⚠️ Group has no valid content for analysis: missingText=${missingText}, missingImages=${missingImages}`
      );
      console.log(`  Messages in group: ${messages.length}`);
      console.log(
        `  Message types: ${messages.map((m: any) => m.type).join(', ')}`
      );

      // LLM should have created valid groups - if we're here, it failed
      // Reset messages so they can be regrouped properly by LLM
      console.log(
        `⚠️ LLM created invalid group (missing ${missingText ? 'text' : ''} ${missingImages ? 'images' : ''}) - resetting messages for regrouping`
      );
      await this.prisma.whatsAppMessage.updateMany({
        where: { id: { in: messageIds } },
        data: {
          processed: false,
          draftProductId: null,
        },
      });

      throw new Error(
        `No valid content for analysis: ${missingText ? 'no text' : ''} ${missingImages ? 'no images' : ''}`
      );
    }

    console.log(`📤 Analyzing product ${productId} with Groq (${imageUrls.length} images)`);

    try {
      // Add timeout to Groq API call
      const groqPromise = (await this.initializeGroq()).chat.completions.create(
        {
          model:
            process.env.GROQ_TEXT_MODEL || 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: TEXT_ANALYSIS_SYSTEM_PROMPT,
            },
            {
              role: 'user',
              content: TEXT_ANALYSIS_USER_PROMPT(textContents, imageUrls),
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.5,
        }
      );

      // Add timeout to Groq API call
      const timeoutPromise = new Promise<never>(
        (_, reject) =>
          setTimeout(() => reject(new Error('Groq API timeout')), 120000) // 2 minute timeout
      );

      const response = await Promise.race([groqPromise, timeoutPromise]);

      const analysisResult = JSON.parse(
        response.choices[0].message.content || '{}'
      );

      // Check if analysis has minimum required data (price and sizes)
      // If missing, updateProductWithAnalysis will handle deletion and throw error

      // Prepare GPT debug data
      const gptRequest = JSON.stringify(
        {
          model: process.env.GROQ_TEXT_MODEL || 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: TEXT_ANALYSIS_SYSTEM_PROMPT,
            },
            {
              role: 'user',
              content: TEXT_ANALYSIS_USER_PROMPT(textContents, imageUrls),
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.5,
        },
        null,
        2
      );

      const gptResponse = JSON.stringify(
        {
          choices: response.choices,
          usage: response.usage,
          model: response.model,
          id: response.id,
          created: response.created,
          object: response.object,
        },
        null,
        2
      );

      // Update product with analysis
      await this.batchProductService.updateProductWithAnalysis(
        productId,
        analysisResult,
        gptRequest,
        gptResponse
      );

      console.log(`✅ Product ${productId} analyzed successfully`);
    } catch (error) {
      console.error(`❌ Error analyzing product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Upload images to S3 and update product
   */
  private async uploadImagesToS3(
    productId: string,
    messageIds: string[]
  ): Promise<void> {
    // Each product gets its own images - no duplicate checking needed
    const messages = await this.prisma.whatsAppMessage.findMany({
      where: { id: { in: messageIds } },
      orderBy: { createdAt: 'asc' },
    });

    const imageMessages = messages.filter(
      (m: any) => m.type === 'imageMessage' && m.mediaUrl
    );

    if (imageMessages.length === 0) {
      console.log(`⚠️ No images found for product ${productId}`);
      return;
    }

    try {
      const uploadedImages = [];

      for (let i = 0; i < imageMessages.length; i++) {
        const message = imageMessages[i];
        const imageUrl = message.mediaUrl!;

        try {

          // Download image from original URL with retry mechanism
          const response = await withRetry(
            async () => {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

              try {
                const response = await fetch(imageUrl, {
                  signal: controller.signal,
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; MarinaObuvBot/1.0)',
                  },
                });

                clearTimeout(timeoutId);
                return response;
              } catch (error) {
                clearTimeout(timeoutId);
                throw error;
              }
            },
            {
              maxRetries: 3,
              baseDelayMs: 2000,
              maxDelayMs: 15000,
              timeoutMs: 30000,
              shouldRetry: (error: unknown) => {
                // Retry on network errors, timeouts, and 5xx errors
                if ((error as any)?.name === 'AbortError') return true;
                if ((error as any)?.message?.includes('timeout')) return true;
                if ((error as any)?.message?.includes('network')) return true;
                if ((error as any)?.message?.includes('ECONNRESET'))
                  return true;
                if ((error as any)?.message?.includes('ENOTFOUND')) return true;
                if ((error as any)?.message?.includes('fetch')) return true;
                return false;
              },
            }
          );

          if (!response.ok) {
            console.log(
              `⚠️ Failed to download image ${i + 1}: ${response.statusText}`
            );
            continue;
          }

          const imageBuffer = Buffer.from(await response.arrayBuffer());
          const contentType =
            response.headers.get('content-type') || 'image/jpeg';

          // Generate S3 key with timestamp to avoid conflicts
          const ext = contentType.split('/')[1] || 'jpg';
          const timestamp = Date.now();
          const s3Key = `products/${productId}/${timestamp}-${Math.random().toString(36).substring(2)}.${ext}`;

          // Upload to S3 with retry mechanism
          const uploadSuccess = await withRetry(
            async () => {
              return await uploadImage(s3Key, imageBuffer, contentType);
            },
            {
              maxRetries: 3,
              baseDelayMs: 1000,
              maxDelayMs: 10000,
              timeoutMs: 60000,
              shouldRetry: (error: unknown) => {
                // Retry on network errors, timeouts, and 5xx errors
                if ((error as any)?.name === 'AbortError') return true;
                if ((error as any)?.message?.includes('timeout')) return true;
                if ((error as any)?.message?.includes('network')) return true;
                if ((error as any)?.message?.includes('ECONNRESET'))
                  return true;
                if ((error as any)?.message?.includes('ENOTFOUND')) return true;
                return false;
              },
            }
          );

          if (uploadSuccess) {
            const publicUrl = getPublicUrl(s3Key);
            uploadedImages.push({
              url: publicUrl,
              key: s3Key,
              alt: `Product image ${i + 1}`,
              sort: i,
              isPrimary: i === 0,
            });
            // Image uploaded successfully
          } else {
            console.error(`❌ Failed to upload image ${i + 1} to S3`);
          }
        } catch (error) {
          console.error(`❌ Error uploading image ${i + 1}:`, error);
          // Continue with next image instead of failing completely
          continue;
        }
      }

      // Update product with uploaded images
      if (uploadedImages.length > 0) {
        // Check if product exists before creating images
        const product = await this.prisma.product.findUnique({
          where: { id: productId },
          select: { id: true },
        });

        if (!product) {
          console.log(
            `⚠️ Product ${productId} not found, skipping image creation`
          );
          return;
        }

        await this.prisma.productImage.createMany({
          data: uploadedImages.map(img => ({
            productId,
            url: img.url,
            key: img.key,
            alt: img.alt,
            sort: img.sort,
            isPrimary: img.isPrimary,
          })),
        });

        console.log(
          `✅ Created ${uploadedImages.length} product images for product ${productId}`
        );
      } else {
        console.log(
          `⚠️ No images were successfully uploaded for product ${productId}`
        );
      }
    } catch (error) {
      console.error(
        `❌ Error uploading images for product ${productId}:`,
        error
      );
      // Don't throw error - continue processing even if image upload fails
      console.log(`⚠️ Continuing processing despite image upload failure`);
    }
  }

  /**
   * Analyze images for comprehensive product information using Groq vision models
   */
  private async detectColorsWithGroq(
    productId: string,
    messageIds: string[]
  ): Promise<void> {
    const messages = await this.prisma.whatsAppMessage.findMany({
      where: { id: { in: messageIds } },
      orderBy: { createdAt: 'asc' },
    });

    const imageUrls = messages
      .filter((m: any) => m.type === 'imageMessage' && m.mediaUrl)
      .map((m: any) => m.mediaUrl!);

    // Extract text content from messages for context
    const textContent = messages
      .map((m: any) => m.text)
      .filter(Boolean)
      .join('\n\n');

    if (imageUrls.length === 0) {
      console.log(`⚠️ No images found for product ${productId}`);
      return;
    }

    try {
      // Get category tree for category selection
      const categoryTree = await getCategoryTree();
      const categoryTreeJson = JSON.stringify(categoryTree, null, 2);

      const analysisResults = [];

      // Process each image individually with Groq vision models
      for (let i = 0; i < imageUrls.length; i++) {
        const imageUrl = imageUrls[i];
        console.log(
          `🎨 Analyzing image ${i + 1}/${imageUrls.length} for product ${productId}`
        );

        try {

          // Add timeout to Groq API call
          const groqPromise = (
            await this.initializeGroq()
          ).chat.completions.create({
            model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
            messages: [
              {
                role: 'system',
                content: IMAGE_ANALYSIS_SYSTEM_PROMPT,
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: IMAGE_ANALYSIS_USER_PROMPT(
                      imageUrl,
                      textContent,
                      categoryTreeJson
                    ),
                  },
                  {
                    type: 'image_url',
                    image_url: { url: imageUrl },
                  },
                ],
              },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
          });

          // Add timeout to Groq API call
          const timeoutPromise = new Promise<never>(
            (_, reject) =>
              setTimeout(() => reject(new Error('Groq API timeout')), 120000) // 2 minute timeout
          );

          const response = await Promise.race([groqPromise, timeoutPromise]);

          const analysisResult = JSON.parse(
            response.choices[0].message.content || '{}'
          );

          // Validate that categoryId is provided
          if (!analysisResult.categoryId) {
            console.log(
              `⚠️ WARNING: LLM did not provide categoryId for image ${i + 1}`
            );
            console.log(
              `   This will cause the product to use default "Обувь" category`
            );
          } else {
            console.log(
              `✅ LLM provided categoryId: ${analysisResult.categoryId}`
            );
          }

          // Add the image URL to the result for mapping
          analysisResult.imageUrl = imageUrl;
          analysisResults.push(analysisResult);

          console.log(
            `✅ Image ${i + 1} analyzed: ${analysisResult.name || 'No name'} - Color: ${analysisResult.color || 'null'}`
          );
        } catch (imageError) {
          console.error(`❌ Error analyzing image ${i + 1}:`, imageError);
          // Continue with other images
        }
      }

      // Extract proper color mappings from analysis results
      const colorMappings =
        this.colorMappingService.extractColorMappingsFromAnalysis(
          analysisResults
        );

      console.log(
        `🎨 Extracted color mappings for product ${productId}:`,
        colorMappings
      );

      // Check if product exists before updating colors
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { id: true },
      });

      if (!product) {
        console.log(
          `⚠️ Product ${productId} not found, skipping color mapping`
        );
        return;
      }

      // Update product with proper color mapping
      await this.colorMappingService.updateProductImagesWithColorMapping(
        productId,
        colorMappings
      );

      // Update product with comprehensive image analysis results (including category validation)
      await this.batchProductService.updateProductWithImageAnalysis(
        productId,
        analysisResults
      );

      // Merge name/description/gender/season from image analysis if missing from first analysis
      await this.mergeGenderSeasonFromImageAnalysis(productId, analysisResults);

      console.log(
        `✅ Image analysis completed for product ${productId}: ${analysisResults.length} images processed`
      );
    } catch (error) {
      console.error(
        `❌ Error analyzing images for product ${productId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Merge name/description/gender/season from image analysis if missing from first analysis
   */
  private async mergeGenderSeasonFromImageAnalysis(
    productId: string,
    imageAnalysisResults: any[]
  ): Promise<void> {
    try {
      // Get current product data
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { name: true, description: true, gender: true, season: true },
      });

      if (!product) {
        console.log(
          `❌ Product ${productId} not found for name/gender/season merge`
        );
        return;
      }

      // Check if we need to merge name/description/gender/season
      const needsName =
        !product.name ||
        product.name.trim() === '' ||
        product.name === 'Untitled Product';
      const needsDescription =
        !product.description || product.description.trim() === '';
      const needsGender = !product.gender || product.gender === null;
      const needsSeason = !product.season || product.season === null;

      if (!needsName && !needsDescription && !needsGender && !needsSeason) {
        console.log(
          `✅ Product ${productId} already has name, description, gender and season, no merge needed`
        );
        return;
      }

      // Get the most confident image analysis result
      const bestResult = imageAnalysisResults[0]; // Use first result as most confident

      if (!bestResult) {
        console.log(
          `⚠️ No image analysis results available for gender/season merge`
        );
        return;
      }

      const updateData: any = {};

      // Merge name if missing
      if (needsName && bestResult.name) {
        updateData.name = bestResult.name;
      }

      // Merge description if missing
      if (needsDescription && bestResult.description) {
        updateData.description = bestResult.description;
      }

      // Merge gender if missing
      if (needsGender && bestResult.gender) {
        updateData.gender = bestResult.gender;
      }

      // Merge season if missing
      if (needsSeason && bestResult.season) {
        updateData.season = bestResult.season;
      }

      // Update product if we have data to merge
      if (Object.keys(updateData).length > 0) {
        await this.prisma.product.update({
          where: { id: productId },
          data: updateData,
        });

        // Merged name/description/gender/season from image analysis
      }
    } catch (error) {
      console.error(
        `❌ Error merging name/description/gender/season from image analysis for product ${productId}:`,
        error
      );
      // Don't throw error - this is not critical
    }
  }
}
