import { prisma } from '../db-node';
import { generateArticleNumber } from './product-creation-mappers';
import { createSlug } from './product-creation-mappers';
import { AnalysisValidationService } from './analysis-validation-service';

export interface CreateInactiveProductParams {
  messageIds: string[];
  productContext: string;
  confidence: number;
}

export interface BatchProductResult {
  productId: string;
}

export class SimpleProductService {
  private validationService: AnalysisValidationService;

  constructor() {
    this.validationService = new AnalysisValidationService();
  }

  /**
   * Create an inactive product for a group of messages
   */
  async createInactiveProduct({
    messageIds,
    productContext,
    confidence,
  }: CreateInactiveProductParams): Promise<BatchProductResult> {
    // Get the first message for basic info
    const firstMessage = await prisma.whatsAppMessage.findFirst({
      where: { id: { in: messageIds } },
      orderBy: { createdAt: 'asc' },
    });

    if (!firstMessage) {
      throw new Error('No messages found for product creation');
    }

    // Create inactive product
    const product = await prisma.product.create({
      data: {
        name: 'Processing...', // Temporary name, will be updated when analysis completes
        slug: createSlug(`product-${Date.now()}`),
        article: generateArticleNumber(),
        categoryId: await this.getDefaultCategoryId(),
        pricePair: 0, // Will be updated when analysis completes
        currency: 'RUB',
        description: 'Product is being processed...',
        isActive: false, // Inactive until processing completes
        sourceMessageIds: messageIds,
        batchProcessingStatus: 'pending',
      },
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
    analysisResult: any
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
      },
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
          detectedColors.push(firstImage.color);
          console.log(`  ✅ Extracted color: ${firstImage.color}`);
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

    // Extract data from analysis results
    let productName = product.name;
    let productDescription = product.description;
    let productGender = product.gender;
    let productSeason = product.season;
    let productMaterial = product.material;
    let productCategoryId = product.categoryId;
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
      if (result.categoryId && !productCategoryId) {
        productCategoryId = result.categoryId;
      }

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
          },
        });
        return;
      }

      await prisma.product.update({
        where: { id: productId },
        data: {
          isActive: true,
          batchProcessingStatus: 'completed',
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
