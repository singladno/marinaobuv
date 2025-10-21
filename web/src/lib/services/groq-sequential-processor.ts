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

          // Step 3: Validate group has image + text (after grouping, before processing)
          const hasValidContent = await this.validateGroupContent(
            group.messageIds
          );
          if (!hasValidContent) {
            console.log(
              `❌ Group ${group.groupId} has no valid content (image + text), skipping but marking messages as processed`
            );
            // Mark messages as processed even if we skip the group
            await this.prisma.whatsAppMessage.updateMany({
              where: { id: { in: group.messageIds } },
              data: { processed: true, aiGroupId: group.groupId },
            });
            continue;
          }

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

            // Step 6: Validate results and activate if valid
            const isValidProduct = await this.validateProductResults(
              productResult.productId
            );
            if (isValidProduct) {
              console.log(
                `✅ Activating product ${productResult.productId}...`
              );
              await this.batchProductService.activateProduct(
                productResult.productId
              );
            } else {
              console.log(
                `❌ Product ${productResult.productId} validation failed, deleting invalid product`
              );
              // Delete the invalid product and its associated data
              await this.deleteInvalidProduct(productResult.productId);
            }
          } catch (processingError) {
            console.error(
              `❌ Error processing product ${productResult.productId}:`,
              processingError
            );
            console.log(
              `🗑️ Cleaning up failed product ${productResult.productId}...`
            );
            // Clean up the failed product
            await this.deleteInvalidProduct(productResult.productId);
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
      select: { type: true, text: true, mediaUrl: true },
    });

    console.log(
      `🔍 Validating group content for ${messageIds.length} messages:`
    );
    messages.forEach((msg: any, index: number) => {
      console.log(
        `  Message ${index + 1}: type="${msg.type}", text="${msg.text?.substring(0, 50)}...", mediaUrl="${msg.mediaUrl ? 'YES' : 'NO'}"`
      );
    });

    const hasText = messages.some(
      (msg: any) => msg.text && msg.text.trim().length > 0
    );
    const hasImage = messages.some(
      (msg: any) =>
        msg.mediaUrl && (msg.type === 'image' || msg.type === 'imageMessage')
    );

    console.log(`  ✅ Has text: ${hasText}`);
    console.log(`  ✅ Has image: ${hasImage}`);
    console.log(`  ✅ Valid group: ${hasText && hasImage}`);

    return hasText && hasImage;
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
      throw new Error('No valid content for analysis');
    }

    console.log(`📤 Sending to Groq for analysis:`);
    console.log(`  Text content: "${textContents.substring(0, 100)}..."`);
    console.log(`  Image URLs: ${imageUrls.length} images`);
    imageUrls.forEach((url: string, index: number) => {
      console.log(`    Image ${index + 1}: ${url}`);
    });

    try {
      // Add timeout to Groq API call
      const groqPromise = (await this.initializeGroq()).chat.completions.create(
        {
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
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

      console.log(`📥 Groq analysis response:`);
      console.log(`  Raw response: ${response.choices[0].message.content}`);
      console.log(`  Parsed result:`, JSON.stringify(analysisResult, null, 2));

      // Validate analysis result
      if (!this.validationService.validateAnalysisResult(analysisResult)) {
        console.log(
          `❌ Analysis validation failed for product ${productId}, skipping analysis update`
        );
        return; // Skip this analysis but continue processing
      }

      // Prepare GPT debug data
      const gptRequest = JSON.stringify(
        {
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
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
          console.log(`📤 Uploading to S3: ${imageUrl}`);

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

          console.log(`Image size: ${imageBuffer.length} bytes`);
          console.log(`Content type: ${contentType}`);

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
            console.log(`✅ Uploaded image ${i + 1} to S3: ${publicUrl}`);
          } else {
            console.log(`❌ Failed to upload image ${i + 1} to S3`);
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

      console.log(
        `🌳 Category tree for LLM (${categoryTree.length} root categories):`
      );
      console.log(categoryTreeJson.substring(0, 500) + '...');

      const analysisResults = [];

      // Process each image individually with Groq vision models
      for (let i = 0; i < imageUrls.length; i++) {
        const imageUrl = imageUrls[i];
        console.log(
          `🎨 Analyzing image ${i + 1}/${imageUrls.length}: ${imageUrl}`
        );
        if (textContent) {
          console.log(
            `📝 Using text context: "${textContent.substring(0, 100)}..."`
          );
        }

        try {
          // Debug: Log what we're sending to LLM
          const promptText = IMAGE_ANALYSIS_USER_PROMPT(
            imageUrl,
            textContent,
            categoryTreeJson
          );
          console.log(`📝 Prompt being sent to LLM (first 1000 chars):`);
          console.log(promptText.substring(0, 1000) + '...');

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

          console.log(`🔍 LLM Analysis Result for image ${i + 1}:`);
          console.log(
            `  Category ID: ${analysisResult.categoryId || 'NOT PROVIDED'}`
          );
          console.log(`  Name: ${analysisResult.name || 'null'}`);
          console.log(`  Gender: ${analysisResult.gender || 'null'}`);
          console.log(`  Season: ${analysisResult.season || 'null'}`);

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
        console.log(`🔄 Merging name from image analysis: ${bestResult.name}`);
      }

      // Merge description if missing
      if (needsDescription && bestResult.description) {
        updateData.description = bestResult.description;
        console.log(
          `🔄 Merging description from image analysis: ${bestResult.description}`
        );
      }

      // Merge gender if missing
      if (needsGender && bestResult.gender) {
        updateData.gender = bestResult.gender;
        console.log(
          `🔄 Merging gender from image analysis: ${bestResult.gender}`
        );
      }

      // Merge season if missing
      if (needsSeason && bestResult.season) {
        updateData.season = bestResult.season;
        console.log(
          `🔄 Merging season from image analysis: ${bestResult.season}`
        );
      }

      // Update product if we have data to merge
      if (Object.keys(updateData).length > 0) {
        await this.prisma.product.update({
          where: { id: productId },
          data: updateData,
        });

        console.log(
          `✅ Merged name/description/gender/season from image analysis for product ${productId}:`,
          updateData
        );
      } else {
        console.log(
          `⚠️ No name/description/gender/season data available in image analysis for product ${productId}`
        );
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
