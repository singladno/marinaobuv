import { prisma } from '../db-node';
import { generateArticleNumber } from './product-creation-mappers';
import { createSlug } from './product-creation-mappers';
import { AnalysisValidationService } from './analysis-validation-service';
import { DeduplicationService } from './deduplication-service';
import { normalizeColorToRussian } from '@/lib/utils/color-normalization';
import {
  getOrCreateProvider,
  extractProviderFromSenderName,
} from '../provider-utils';

export interface CreateInactiveProductParams {
  messageIds: string[];
  productContext: string;
  confidence: number;
  gptRequest?: string;
  gptResponse?: string;
}

export interface BatchProductResult {
  productId: string;
}

export class SimpleProductService {
  private validationService: AnalysisValidationService;
  private deduplicationService: DeduplicationService;

  constructor() {
    this.validationService = new AnalysisValidationService();
    this.deduplicationService = new DeduplicationService();
  }

  /**
   * Create an inactive product for a group of messages
   */
  async createInactiveProduct({
    messageIds,
    productContext,
    confidence,
    gptRequest,
    gptResponse,
  }: CreateInactiveProductParams): Promise<BatchProductResult> {
    // Get the first message for basic info
    const firstMessage = await prisma.whatsAppMessage.findFirst({
      where: { id: { in: messageIds } },
      orderBy: { createdAt: 'asc' },
    });

    if (!firstMessage) {
      throw new Error('No messages found for product creation');
    }

    // No duplicate checking - each group gets its own product

    // Check if messages are already processed
    const processedCheck =
      await this.deduplicationService.checkMessagesAlreadyProcessed(messageIds);
    if (processedCheck.isDuplicate) {
      console.log(`⚠️  Messages already processed: ${processedCheck.reason}`);
      console.log(
        `🔄 Skipping product creation for message group: ${messageIds.join(', ')}`
      );

      // Return a dummy result since we can't create a product
      return {
        productId: 'skipped-already-processed',
      };
    }

    // Get or create provider from message data
    // Try to extract name from fromName first, then from rawPayload
    let extractedName: string | null = null;
    let extractedPlace: string | null = null;

    if (firstMessage.fromName) {
      const result = extractProviderFromSenderName(firstMessage.fromName);
      extractedName = result.name;
      extractedPlace = result.place;
    } else {
      // Try to extract from rawPayload
      const rawPayload = firstMessage.rawPayload as any;
      const pushName =
        rawPayload?.from_name || rawPayload?.pushName || rawPayload?.senderName;
      if (pushName) {
        const result = extractProviderFromSenderName(pushName);
        extractedName = result.name;
        extractedPlace = result.place;
      }
    }

    const providerId = await getOrCreateProvider(
      firstMessage.from,
      extractedName,
      extractedPlace // Use extracted place if available
    );

    // Create inactive product
    const product = await prisma.product.create({
      data: {
        name: 'Processing...', // Temporary name, will be updated when analysis completes
        slug: createSlug(`product-${Date.now()}`),
        article: generateArticleNumber(),
        categoryId: await this.getDefaultCategoryId(),
        providerId: providerId, // Add provider ID
        pricePair: 0, // Will be updated when analysis completes
        currency: 'RUB',
        description: 'Product is being processed...',
        isActive: false, // Inactive until processing completes
        sourceMessageIds: messageIds,
        source: 'WA', // Products from WhatsApp parser
        batchProcessingStatus: 'pending',
        gptRequest: gptRequest || null,
        gptResponse: gptResponse || null,
      } as any,
    });

    // Mark messages as processed (they're now linked to this product)
    await prisma.whatsAppMessage.updateMany({
      where: { id: { in: messageIds } },
      data: {
        processed: true,
        // Remove aiGroupId since we're using product-based tracking now
        aiGroupId: null,
      },
    });

    console.log(`✅ Created inactive product ${product.id}`);

    return {
      productId: product.id,
    };
  }

  /**
   * Update product when analysis completes
   */
  async updateProductWithAnalysis(
    productId: string,
    analysisResult: any,
    gptRequest?: string,
    gptResponse?: string
  ): Promise<void> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      console.error(`❌ Product not found: ${productId}`);
      return;
    }

    // Validate analysis result before updating
    if (!this.validationService.validateAnalysisResult(analysisResult)) {
      console.log(`❌ Analysis validation failed for product ${product.id}`);
      console.log(`❌ Product will be marked as failed and not activated`);

      // Mark product as failed instead of updating with invalid data
      await prisma.product.update({
        where: { id: product.id },
        data: {
          batchProcessingStatus: 'failed',
          name: 'Invalid Product - Missing Required Data',
          description: 'Product failed validation - missing required fields',
          activeUpdatedAt: new Date(), // Update the activeUpdatedAt field
        },
      });

      console.log(
        `❌ Product ${product.id} marked as failed due to validation`
      );
      return;
    }

    // Update product with analysis results
    await prisma.product.update({
      where: { id: product.id },
      data: {
        name: analysisResult.name || 'Untitled Product',
        description: analysisResult.description || '',
        material: analysisResult.material || '',
        pricePair: analysisResult.price || 0,
        gender: analysisResult.gender || null,
        season: analysisResult.season || null,
        sizes: analysisResult.sizes || [],
        batchProcessingStatus: 'analysis_complete',
        activeUpdatedAt: new Date(), // Update the activeUpdatedAt field
        // Store GPT debug data
        gptRequest: gptRequest || null,
        gptResponse: gptResponse || null,
      } as any,
    });

    console.log(`✅ Updated product ${product.id} with analysis results`);
  }

  /**
   * Update product when color detection completes
   */
  async updateProductWithColors(
    productId: string,
    colorResults: any[]
  ): Promise<void> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });

    if (!product) {
      console.error(`❌ Product not found: ${productId}`);
      return;
    }

    console.log(
      `🎨 Processing color results for product ${productId}:`,
      colorResults
    );

    // Extract colors from color results - each result should have one color
    const detectedColors: string[] = [];

    console.log('🔍 Debugging color results structure:');
    console.log('Color results:', JSON.stringify(colorResults, null, 2));

    for (const result of colorResults) {
      console.log('Processing result:', JSON.stringify(result, null, 2));

      // Each result should have a single color in the images array
      if (
        result.images &&
        Array.isArray(result.images) &&
        result.images.length > 0
      ) {
        const firstImage = result.images[0];
        if (firstImage.color) {
          const normalizedColor = normalizeColorToRussian(firstImage.color);
          if (normalizedColor) {
            detectedColors.push(normalizedColor);
            console.log(
              `  ✅ Extracted color: ${firstImage.color} → ${normalizedColor}`
            );
          } else {
            console.log(
              `  ⚠️  No valid color after normalization: ${firstImage.color}`
            );
          }
        } else {
          console.log(`  ⚠️  No color in first image:`, firstImage);
        }
      } else {
        console.log(`  ❌ No valid images array in result:`, result);
      }
    }

    console.log(`🎨 Detected colors:`, detectedColors);

    // Update product images with detected colors in order
    let updatedCount = 0;
    const sortedImages = product.images.sort(
      (a: any, b: any) => a.sort - b.sort
    );

    for (
      let i = 0;
      i < Math.min(sortedImages.length, detectedColors.length);
      i++
    ) {
      const image = sortedImages[i];
      const color = detectedColors[i];

      await prisma.productImage.update({
        where: { id: image.id },
        data: { color: color },
      });
      updatedCount++;
      console.log(
        `  ✅ Updated image ${image.id} (sort: ${image.sort}) with color: ${color}`
      );
    }

    // Update product batch processing status
    await prisma.product.update({
      where: { id: product.id },
      data: {
        batchProcessingStatus: 'colors_complete',
        activeUpdatedAt: new Date(), // Update the activeUpdatedAt field
      },
    });

    console.log(
      `✅ Updated product ${product.id} with color results: ${updatedCount} images updated`
    );
  }

  /**
   * Update product with comprehensive image analysis results
   */
  async updateProductWithImageAnalysis(
    productId: string,
    analysisResults: any[]
  ): Promise<void> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });

    if (!product) {
      console.error(`❌ Product not found: ${productId}`);
      return;
    }

    console.log(
      `🎨 Processing image analysis results for product ${productId}:`,
      analysisResults
    );

    // Process category selection from analysis results
    let selectedCategoryId: string | null = null;

    if (analysisResults.length > 0) {
      const firstAnalysis = analysisResults[0];

      if (firstAnalysis.categoryId) {
        // Validate that the category exists
        const category = await prisma.category.findUnique({
          where: { id: firstAnalysis.categoryId, isActive: true },
        });

        if (category) {
          selectedCategoryId = firstAnalysis.categoryId;
          console.log(
            `✅ Selected category: ${category.name} (${category.id})`
          );
        } else {
          console.log(
            `⚠️ Invalid category ID: ${firstAnalysis.categoryId}, falling back to default`
          );
        }
      }
    }

    // Fallback to default "Обувь" category if no valid category selected
    if (!selectedCategoryId) {
      const defaultCategory = await prisma.category.findFirst({
        where: { name: 'Обувь', isActive: true },
      });

      if (defaultCategory) {
        selectedCategoryId = defaultCategory.id;
        console.log(`🔄 Using default category: Обувь (${defaultCategory.id})`);
      } else {
        console.error(`❌ Default category "Обувь" not found!`);
        return;
      }
    }

    // Extract data from analysis results
    let productName = product.name;
    let productDescription = product.description;
    let productGender = product.gender;
    let productSeason = product.season;
    let productMaterial = product.material;
    // Use the validated category ID
    const productCategoryId = selectedCategoryId;
    const detectedColors: string[] = [];

    // Process each analysis result
    for (const result of analysisResults) {
      console.log(
        'Processing analysis result:',
        JSON.stringify(result, null, 2)
      );

      // Extract product information from the first result
      if (result.name && !productName) {
        productName = result.name;
      }
      if (result.description && !productDescription) {
        productDescription = result.description;
      }
      if (result.gender && !productGender) {
        productGender = result.gender;
      }
      if (result.season && !productSeason) {
        productSeason = result.season;
      }
      if (result.material && !productMaterial) {
        productMaterial = result.material;
      }
      // Category is already validated and set above

      // Extract colors
      if (result.colors && Array.isArray(result.colors)) {
        detectedColors.push(...result.colors);
      }
    }

    console.log(`🎨 Extracted data:`, {
      name: productName,
      description: productDescription,
      gender: productGender,
      season: productSeason,
      material: productMaterial,
      categoryId: productCategoryId,
      colors: detectedColors,
    });

    // Update product with extracted information
    await prisma.product.update({
      where: { id: product.id },
      data: {
        name: productName,
        description: productDescription,
        gender: productGender,
        season: productSeason,
        material: productMaterial,
        categoryId: productCategoryId,
      },
    });

    // Update product images with detected colors in order
    let updatedCount = 0;
    const sortedImages = product.images.sort(
      (a: any, b: any) => a.sort - b.sort
    );

    for (
      let i = 0;
      i < Math.min(sortedImages.length, detectedColors.length);
      i++
    ) {
      const image = sortedImages[i];
      const color = detectedColors[i];

      await prisma.productImage.update({
        where: { id: image.id },
        data: { color: color },
      });
      updatedCount++;
      console.log(
        `  ✅ Updated image ${image.id} (sort: ${image.sort}) with color: ${color}`
      );
    }

    // Update product batch processing status
    await prisma.product.update({
      where: { id: product.id },
      data: {
        batchProcessingStatus: 'colors_complete',
        activeUpdatedAt: new Date(), // Update the activeUpdatedAt field
      },
    });

    console.log(
      `✅ Updated product ${product.id} with image analysis: ${updatedCount} images updated`
    );
  }

  /**
   * Activate product when both batches complete
   */
  async activateProduct(productId: string): Promise<void> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      console.error(`❌ Product ${productId} not found`);
      return;
    }

    // Only activate if both batches completed successfully
    if (product.batchProcessingStatus === 'colors_complete') {
      // Final validation before activation
      if (
        !product.name ||
        product.name === 'Processing...' ||
        !product.pricePair ||
        Number(product.pricePair) <= 0 ||
        !product.sizes ||
        !Array.isArray(product.sizes) ||
        product.sizes.length === 0
      ) {
        console.log(
          `❌ Product ${productId} failed final validation - missing required data`
        );
        console.log(`   Name: ${product.name}`);
        console.log(`   Price: ${product.pricePair}`);
        console.log(`   Sizes: ${JSON.stringify(product.sizes)}`);
        await prisma.product.update({
          where: { id: productId },
          data: {
            batchProcessingStatus: 'failed',
            name: 'Invalid Product - Missing Required Data',
            description:
              'Product failed final validation - missing required fields',
            activeUpdatedAt: new Date(), // Update the activeUpdatedAt field
          },
        });
        return;
      }

      await prisma.product.update({
        where: { id: productId },
        data: {
          isActive: true,
          batchProcessingStatus: 'completed',
          activeUpdatedAt: new Date(), // Update the activeUpdatedAt field
        },
      });

      console.log(`✅ Activated product ${productId}`);
    }
  }

  /**
   * Get default category ID
   */
  private async getDefaultCategoryId(): Promise<string> {
    const category = await prisma.category.findFirst({
      where: { name: 'Обувь' },
    });

    if (!category) {
      throw new Error('Default category not found');
    }

    return category.id;
  }
}
