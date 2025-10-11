import Groq from 'groq-sdk';
import { prisma } from '../db-node';
import { GroqGroupingService } from './groq-grouping-service';
import { SimpleProductService } from './simple-product-service';
import { AnalysisValidationService } from './analysis-validation-service';
import { FixedColorMappingService } from './fixed-color-mapping-service';
import { getCategoryTree } from '../catalog-categories';
import { getGroqConfig } from '../groq-proxy-config';
import { uploadImage, getObjectKey, getPublicUrl } from '../storage';

export class GroqSequentialProcessor {
  private groq: Groq;
  private groupingService: GroqGroupingService;
  private batchProductService: SimpleProductService;
  private validationService: AnalysisValidationService;
  private colorMappingService: FixedColorMappingService;

  constructor() {
    this.groq = new Groq(getGroqConfig());
    this.groupingService = new GroqGroupingService();
    this.batchProductService = new SimpleProductService();
    this.validationService = new AnalysisValidationService();
    this.colorMappingService = new FixedColorMappingService();
  }

  /**
   * Process messages sequentially: Group → Analysis → Colors
   */
  async processMessagesToProducts(messageIds: string[]): Promise<{
    anyProcessed: boolean;
    finalizedMessageIds: string[];
  }> {
    console.log(
      `🚀 Starting Groq sequential processing for ${messageIds.length} messages`
    );

    try {
      // Step 1: Group messages using Groq
      console.log('📊 Step 1: Grouping messages...');
      const groups = await this.groupMessagesWithGroq(messageIds);

      if (groups.length === 0) {
        console.log('❌ No valid message groups found');
        return { anyProcessed: false, finalizedMessageIds: [] };
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
            await prisma.whatsAppMessage.updateMany({
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
            });

          // Step 3: Analyze product with Groq
          console.log(
            `🔍 Step 2: Analyzing product ${productResult.productId}...`
          );
          await this.analyzeProductWithGroq(
            productResult.productId,
            group.messageIds
          );

          // Step 4: Upload images to S3
          console.log(
            `📤 Step 3: Uploading images to S3 for product ${productResult.productId}...`
          );
          await this.uploadImagesToS3(
            productResult.productId,
            group.messageIds
          );

          // Step 5: Detect colors with Groq
          console.log(
            `🎨 Step 4: Detecting colors for product ${productResult.productId}...`
          );
          await this.detectColorsWithGroq(
            productResult.productId,
            group.messageIds
          );

          // Step 6: Validate results and activate if valid
          const isValidProduct = await this.validateProductResults(
            productResult.productId
          );
          if (isValidProduct) {
            console.log(`✅ Activating product ${productResult.productId}...`);
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
      return { anyProcessed: true, finalizedMessageIds: messageIds };
    } catch (error) {
      console.error('❌ Error in sequential processing:', error);
      return { anyProcessed: false, finalizedMessageIds: [] };
    }
  }

  /**
   * Group messages using Groq
   */
  private async groupMessagesWithGroq(messageIds: string[]): Promise<any[]> {
    const messages = await prisma.whatsAppMessage.findMany({
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
   * Validate product results after Groq processing
   */
  private async deleteInvalidProduct(productId: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting invalid product ${productId}...`);

      // Delete associated images first
      const deletedImages = await prisma.productImage.deleteMany({
        where: { productId },
      });
      console.log(`✅ Deleted ${deletedImages.count} product images`);

      // Delete the product
      await prisma.product.delete({
        where: { id: productId },
      });
      console.log(`✅ Deleted invalid product ${productId}`);
    } catch (error) {
      console.error(`❌ Error deleting invalid product ${productId}:`, error);
    }
  }

  private async validateProductResults(productId: string): Promise<boolean> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          name: true,
          description: true,
          pricePair: true,
          gender: true,
          season: true,
          sizes: true,
          material: true,
        },
      });

      if (!product) {
        console.log(`❌ Product ${productId} not found`);
        return false;
      }

      // Check if product has essential data
      const hasName = product.name && product.name.trim().length > 0;
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

      console.log(`🔍 Validating product ${productId}:`);
      console.log(`  Name: ${hasName ? '✅' : '❌'} (${product.name})`);
      console.log(`  Description: ${hasDescription ? '✅' : '❌'}`);
      console.log(`  Price: ${hasPrice ? '✅' : '❌'} (${product.pricePair})`);
      console.log(`  Gender: ${hasGender ? '✅' : '❌'} (${product.gender})`);
      console.log(`  Season: ${hasSeason ? '✅' : '❌'} (${product.season})`);
      console.log(
        `  Sizes: ${hasSizes ? '✅' : '❌'} (${Array.isArray(product.sizes) ? (product.sizes as any[]).length : 0} sizes)`
      );

      const isValid =
        hasName &&
        hasDescription &&
        hasPrice &&
        hasGender &&
        hasSeason &&
        hasSizes;
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
    const messages = await prisma.whatsAppMessage.findMany({
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
    const messages = await prisma.whatsAppMessage.findMany({
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
      const response = await this.groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are a product analysis expert for a shoe store. Analyze the provided product information and return a JSON response with the following structure:
{
  "name": "Product name in Russian",
  "description": "Product description in Russian",
  "material": "Material type",
  "price": 0,
  "gender": "MALE/FEMALE",
  "season": "SPRING/SUMMER/AUTUMN/WINTER",
  "sizes": [{"size": "36", "count": 1}, {"size": "37", "count": 1}],
  "packPairs": 2,
  "providerDiscount": 500
}

CRITICAL REQUIREMENTS:
- MARKETING LANGUAGE RULES (STRICT):
  - We sell affordable shoes. Avoid premium positioning.
  - DO NOT use words in Russian like "натуральный", "натуральная", "натуральное", "натуральные".
  - DO NOT use words like "люкс", "lux", "премиум", or similar luxury claims.
  - If material is mentioned, prefer artificial/synthetic wording (e.g., "искусственная кожа", "синтетика", "текстиль").
  - The description must never claim natural/real leather/fur/wool.

- STRICT ENUMS:
  - gender MUST be EXACTLY one of: "MALE", "FEMALE" (uppercase only) - NO UNISEX ALLOWED
  - season MUST be EXACTLY one of: "SPRING", "SUMMER", "AUTUMN", "WINTER" (uppercase only)
  - ALWAYS determine gender - if unclear from image/text, use size-based decision:
    * Sizes 35-40 typically indicate FEMALE
    * Sizes 41-45 typically indicate MALE
    * If no sizes available, analyze visual design: feminine features (heels, decorative elements) = FEMALE, masculine features (bulky, simple design) = MALE
  - If season unclear → use "AUTUMN".

- ALWAYS extract sizes with quantities: [{"size": "36", "count": 1}, {"size": "37", "count": 1}]
- ALWAYS calculate packPairs from sizes (sum of all count values)
- ALWAYS provide a proper product name in RUSSIAN based on images and text
- ALWAYS provide a detailed description in RUSSIAN based on images and text
- NEVER use "Унисекс" or "унисекс" in product names - always specify gender (Женские/Мужские)

Size Extraction Rules (CRITICAL):
- ONLY extract sizes that are clearly shoe sizes (typically 35-45 for adults, 20-35 for children)
- DO NOT interpret provider place/address as sizes (e.g., "3/4/17" is a market place, NOT sizes)
- DO NOT interpret phone numbers, addresses, or coordinates as sizes
- Look for explicit size mentions like "размеры 36/37/38" or "36,37,38" or "36-38"
- Size patterns: "36/37/38/39/40/41" means 1 pair of each size (36:1, 37:1, 38:1, etc.)
- Size patterns: "36:2/37:1/38:3" means 2 pairs of 36, 1 pair of 37, 3 pairs of 38
- NEW PATTERN: "🆕Раз:36/37/38:2/39:2/40/41" means:
  * Create base sizes: 36, 37, 38, 39, 40, 41 (each with count=1)
  * Add extra pairs for sizes 38 and 39 (each gets +1 count due to :2)
  * Result: 36(1), 37(1), 38(2), 39(2), 40(1), 41(1) = 8 pairs total
- If no quantity is specified for a size, assume 1 pair
- Always include count field, never use 0
- If no clear size information is provided, omit the sizes field entirely
- Be very conservative - only extract if you're 100% sure they are shoe sizes

Pack Pairs Calculation (ALWAYS REQUIRED):
- ALWAYS calculate packPairs from sizes if not explicitly mentioned by provider
- Count total pairs: sum up all count values from sizes array
- Examples: "36/37/38/39/40/41" → 6 pairs, "36/37/38/38/39/39/40/41" → 8 pairs
- If packPairs is explicitly mentioned in text, use that value instead
- If no sizes are available, packPairs should be null

Provider Discount Extraction (CRITICAL):
- Look for discount patterns like "С КОРОБКИ 500Р СКИДКА", "скидка 500", "скидка 400"
- Also look for simple negative numbers like "-500", "-400", "—500" (these are discount amounts)
- Store discount amounts in rubles (no conversion needed)
- Only extract if discount is explicitly mentioned
- Examples: "500Р СКИДКА" = 500 rubles, "-500" = 500 rubles, "—500" = 500 rubles
- If no discount mentioned, set providerDiscount to 0

Be precise and accurate`,
          },
          {
            role: 'user',
            content: `Product information: ${textContents}\n\nImages: ${imageUrls.join(', ')}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });

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

      // Update product with analysis
      await this.batchProductService.updateProductWithAnalysis(
        productId,
        analysisResult
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
    const messages = await prisma.whatsAppMessage.findMany({
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
          // Download image from original URL
          const response = await fetch(imageUrl);
          if (!response.ok) {
            console.log(
              `⚠️ Failed to download image ${i + 1}: ${response.statusText}`
            );
            continue;
          }

          const imageBuffer = Buffer.from(await response.arrayBuffer());
          const contentType =
            response.headers.get('content-type') || 'image/jpeg';

          // Generate S3 key
          const ext = contentType.split('/')[1] || 'jpg';
          const s3Key = getObjectKey({ productId, ext });

          // Upload to S3
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
        }
      }

      // Update product with uploaded images
      if (uploadedImages.length > 0) {
        await prisma.productImage.createMany({
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
      throw error;
    }
  }

  /**
   * Analyze images for comprehensive product information using Groq vision models
   */
  private async detectColorsWithGroq(
    productId: string,
    messageIds: string[]
  ): Promise<void> {
    const messages = await prisma.whatsAppMessage.findMany({
      where: { id: { in: messageIds } },
      orderBy: { createdAt: 'asc' },
    });

    const imageUrls = messages
      .filter((m: any) => m.type === 'imageMessage' && m.mediaUrl)
      .map((m: any) => m.mediaUrl!);

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
          `🎨 Analyzing image ${i + 1}/${imageUrls.length}: ${imageUrl}`
        );

        try {
          const response = await this.groq.chat.completions.create({
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            messages: [
              {
                role: 'system',
                content: `You are an expert shoe analyst for a shoe store. Analyze the image and extract comprehensive product information.

CRITICAL REQUIREMENTS:
- MARKETING LANGUAGE RULES (STRICT):
  - We sell affordable shoes. Avoid premium positioning.
  - DO NOT use words in Russian like "натуральный", "натуральная", "натуральное", "натуральные".
  - DO NOT use words like "люкс", "lux", "премиум", or similar luxury claims.
  - If material is mentioned or needs to be inferred, prefer artificial/synthetic wording (e.g., "искусственная кожа", "синтетика", "текстиль").
  - The description must never claim natural/real leather/fur/wool.

- STRICT ENUMS:
  - gender MUST be EXACTLY one of: "MALE", "FEMALE" (uppercase only) - NO UNISEX ALLOWED
  - season MUST be EXACTLY one of: "SPRING", "SUMMER", "AUTUMN", "WINTER" (uppercase only)
  - Analyze the shoe design to determine gender (heels/decorative vs. bulky/simple)
  - Analyze the shoe style to determine season (open vs. closed, thickness, etc.)
  - If season unclear → use "AUTUMN"

- ALWAYS provide a proper product name in RUSSIAN based on the image
- ALWAYS provide a detailed description in RUSSIAN based on the image
- ALWAYS detect the primary color of the shoe
- ALWAYS determine the product category from the provided category tree
- ALWAYS determine the season based on the shoe style and design
- ALWAYS detect the material from the shoe appearance

Category Detection (CRITICAL):
- ALWAYS try to find a suitable category from the provided category tree FIRST
- Choose the most SPECIFIC and DETAILED category from the provided category tree
- ALWAYS select the DEEPEST/MOST SPECIFIC category (leaf categories with no children)
- NEVER select parent categories like "Обувь", "Женская обувь", "Мужская обувь", "Детская обувь"
- ALWAYS select the deepest/most specific category available
- Examples of CORRECT selections:
  * Instead of "Обувь" → choose "Обувь - Мужская обувь - Зима - ботинки"
  * Instead of "Женская обувь" → choose "Обувь - Женская обувь - Лето - сандалии"
  * Instead of "Мужская обувь" → choose "Обувь - Мужская обувь - Осень - кроссовки"
- Consider the exact shoe type: сапоги, ботинки, туфли, кроссовки, сандалии, босоножки
- Consider season and style for maximum accuracy
- CRITICAL: Return the EXACT "id" field from the category tree, not the name
- ONLY use "newCategory" field if NO suitable leaf category exists in the tree
- CRITICAL: Only return categories that have NO children (leaf categories only)

ДОСТУПНЫЕ КАТЕГОРИИ:
${categoryTreeJson}

Return only valid JSON with the following structure:
{
  "name": "Название продукта на русском",
  "gender": "FEMALE",  // one of: MALE | FEMALE (NO UNISEX)
  "season": "AUTUMN",   // one of: SPRING | SUMMER | AUTUMN | WINTER
  "colors": ["черный", "коричневый"],
  "description": "Подробное описание продукта на русском языке без слов 'натуральный' и 'люкс'",
  "material": "искусственная кожа",
  "categoryId": "category_id_from_tree_or_null",
  "newCategory": {
    "name": "Новая категория",
    "slug": "new-category-slug",
    "parentCategoryId": "parent_category_id"
  }
}`,
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Analyze this shoe image and extract comprehensive product information including name, description, gender, color, and category. Return JSON with the product details.',
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

          const analysisResult = JSON.parse(
            response.choices[0].message.content || '{}'
          );

          // Add the image URL to the result for mapping
          analysisResult.imageUrl = imageUrl;
          analysisResults.push(analysisResult);

          console.log(
            `✅ Image ${i + 1} analyzed: ${analysisResult.name || 'No name'} - ${analysisResult.colors?.[0] || 'No color'}`
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

      // Update product with proper color mapping
      await this.colorMappingService.updateProductImagesWithColorMapping(
        productId,
        colorMappings
      );

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
}
