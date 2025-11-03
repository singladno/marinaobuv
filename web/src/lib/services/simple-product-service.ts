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
import { getCategoryTree, type CategoryNode } from '../catalog-categories';
import { getGroqConfig } from '../groq-proxy-config';
import Groq from 'groq-sdk';

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
    // Note: categoryId will be set after analysis, but Prisma requires it
    // We'll determine a temporary category from a default, then update it after analysis
    // For now, we need to provide some category - we'll update it immediately after analysis
    const product = await prisma.product.create({
      data: {
        name: 'Processing...', // Temporary name, will be updated when analysis completes
        slug: createSlug(`product-${Date.now()}`),
        article: generateArticleNumber(),
        // categoryId is required - we'll update it immediately after creation
        // Use a placeholder, will be updated in updateProductWithAnalysis
        categoryId: await this.getTemporaryCategoryId(),
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

    // Validate that analysis result has minimum required fields before updating
    // If missing critical data (price, sizes), skip creating this product entirely
    const hasPrice =
      analysisResult.price !== undefined &&
      analysisResult.price !== null &&
      analysisResult.price > 0;
    const hasSizes =
      analysisResult.sizes &&
      Array.isArray(analysisResult.sizes) &&
      analysisResult.sizes.length > 0;

    if (!hasPrice || !hasSizes) {
      console.log(
        `❌ Analysis result missing required data - skipping product creation`
      );
      console.log(
        `   Price: ${hasPrice ? '✅' : '❌'} (${analysisResult.price})`
      );
      console.log(
        `   Sizes: ${hasSizes ? '✅' : '❌'} (${JSON.stringify(analysisResult.sizes)})`
      );
      console.log(`🗑️ Deleting product ${product.id} - required data missing`);

      // Delete the product entirely since it doesn't have required data
      await prisma.product.delete({
        where: { id: product.id },
      });

      // Also clear message associations to allow reprocessing
      await prisma.whatsAppMessage.updateMany({
        where: { draftProductId: product.id },
        data: {
          draftProductId: null,
          processed: false,
        },
      });

      // Throw error to stop further processing (image analysis)
      // This prevents wasting API costs on invalid products
      throw new Error(
        `Product deleted: missing required data (price or sizes). Price: ${hasPrice ? 'valid' : 'missing'}, Sizes: ${hasSizes ? 'valid' : 'missing'}`
      );
    }

    console.log(
      `✅ Analysis result has required data - updating product ${product.id}`
    );

    // NOTE: Category will be determined from image analysis (which also returns categoryId)
    // Text analysis doesn't provide categoryId, so we keep the temporary category for now
    const productName = analysisResult.name || 'Untitled Product';

    // Update product with analysis results (category will be set later from image analysis)
    await prisma.product.update({
      where: { id: product.id },
      data: {
        name: productName,
        description: analysisResult.description || '',
        material: analysisResult.material || '',
        pricePair: analysisResult.price || 0,
        gender: analysisResult.gender || null,
        season: analysisResult.season || null,
        sizes: analysisResult.sizes || [],
        // categoryId will be set by updateProductWithImageAnalysis from image analysis results
        batchProcessingStatus: 'analysis_complete',
        activeUpdatedAt: new Date(), // Update the activeUpdatedAt field
        // Store GPT debug data
        gptRequest: gptRequest || null,
        gptResponse: gptResponse || null,
      } as any,
    });

    console.log(
      `✅ Updated product ${product.id} with analysis results, name: "${productName}" (category will be set from image analysis)`
    );
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
    // Priority: 1) categoryId from image analysis, 2) determine from product name
    let selectedCategoryId: string | null = null;

    if (analysisResults.length > 0) {
      const firstAnalysis = analysisResults[0];

      if (firstAnalysis.categoryId) {
        // Validate that the category exists and is not a high-level category
        const category = await prisma.category.findUnique({
          where: { id: firstAnalysis.categoryId, isActive: true },
          include: { children: { where: { isActive: true } } },
        });

        if (category) {
          // Only use if it's a leaf category (no children) or if it's not "Обувь"
          if (category.children.length === 0 && category.name !== 'Обувь') {
            selectedCategoryId = firstAnalysis.categoryId;
            console.log(
              `✅ Selected category from image analysis: ${category.name} (${category.id})`
            );
          } else {
            console.log(
              `⚠️ Category from image analysis is not deepest level or is "Обувь": ${category.name}, will determine from product name`
            );
          }
        } else {
          console.log(
            `⚠️ Invalid category ID from image analysis: ${firstAnalysis.categoryId}, will determine from product name`
          );
        }
      }
    }

    // If no valid deep category from image analysis, determine from product name
    if (!selectedCategoryId) {
      const productName =
        product.name && product.name !== 'Processing...'
          ? product.name
          : analysisResults[0]?.name || 'Untitled Product';
      selectedCategoryId = await this.determineCategoryFromName(productName);
      console.log(
        `✅ Determined category from product name "${productName}": ${selectedCategoryId}`
      );
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
        categoryId: productCategoryId || undefined,
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
      // Final check - if still missing critical data, delete instead of marking as failed
      if (
        !product.pricePair ||
        Number(product.pricePair) <= 0 ||
        !product.sizes ||
        !Array.isArray(product.sizes) ||
        product.sizes.length === 0
      ) {
        console.log(
          `❌ Product ${productId} missing required data - deleting product`
        );
        console.log(`   Price: ${product.pricePair}`);
        console.log(`   Sizes: ${JSON.stringify(product.sizes)}`);

        // Delete the product entirely instead of marking as failed
        await prisma.product.delete({
          where: { id: productId },
        });

        // Clear message associations to allow reprocessing
        await prisma.whatsAppMessage.updateMany({
          where: { draftProductId: productId },
          data: {
            draftProductId: null,
            processed: false,
          },
        });

        console.log(`🗑️ Deleted product ${productId} - required data missing`);
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
   * Get a temporary category ID for product creation
   * This is only used during creation - category will be updated after analysis
   */
  private async getTemporaryCategoryId(): Promise<string> {
    // Get any leaf category (not "Обувь") to use as temporary category
    const categoryTree = await getCategoryTree();
    const leafCategories = this.getLeafCategories(categoryTree);
    const validCategory = leafCategories.find(cat => cat.name !== 'Обувь');

    if (validCategory) {
      return validCategory.id;
    }

    // Last resort: find any active category
    const anyCategory = await prisma.category.findFirst({
      where: { isActive: true, name: { not: 'Обувь' } },
    });

    if (anyCategory) {
      return anyCategory.id;
    }

    // Absolute last resort - shouldn't happen but prevents crash
    throw new Error('No valid category found for product creation');
  }

  /**
   * Determine category from product name using LLM
   * Always returns the deepest-level category, never high-level like "Обувь"
   */
  private async determineCategoryFromName(
    productName: string
  ): Promise<string | null> {
    try {
      // Get category tree
      const categoryTree = await getCategoryTree();

      // Find all leaf categories (deepest level, no children)
      const leafCategories = this.getLeafCategories(categoryTree);

      if (leafCategories.length === 0) {
        console.error(`❌ No leaf categories found in category tree`);
        return null;
      }

      // Filter out "Обувь" category
      const validCategories = leafCategories.filter(
        cat => cat.name !== 'Обувь'
      );

      if (validCategories.length === 0) {
        console.error(`❌ No valid deep categories found (all are "Обувь")`);
        return null;
      }

      console.log(
        `🔍 Analyzing product name "${productName}" to determine category`
      );
      console.log(
        `   Found ${validCategories.length} leaf categories to choose from`
      );

      // Use LLM to determine the best matching category
      const groqConfig = await getGroqConfig();
      const groq = new Groq({ apiKey: groqConfig.apiKey });

      const categoryOptions = validCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        path: cat.path,
      }));

      const categoryPrompt = `You are a category classification expert for a shoe store.

PRODUCT NAME: "${productName}"

AVAILABLE CATEGORIES (DEEPEST LEVEL ONLY):
${JSON.stringify(categoryOptions, null, 2)}

TASK:
1. Analyze the product name to determine the type of shoe
2. Select the MOST SPECIFIC and DEEPEST category that matches
3. Example: "Женские зимние ботинки" → should match a specific category like "Женские зимние ботинки" or "Ботинки зимние женские"
4. NEVER return "Обувь" or any high-level category
5. Return ONLY the category ID of the most specific match

Return JSON:
{
  "categoryId": "exact-category-id-from-list"
}`;

      const response = await groq.chat.completions.create({
        model:
          process.env.GROQ_TEXT_MODEL || 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content:
              'You are a category classification expert. Always select the most specific category from the provided list.',
          },
          {
            role: 'user',
            content: categoryPrompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      const selectedCategoryId = result.categoryId;

      // Validate the selected category exists in our list
      const isValid = validCategories.some(
        cat => cat.id === selectedCategoryId
      );

      if (isValid && selectedCategoryId) {
        const selectedCategory = validCategories.find(
          cat => cat.id === selectedCategoryId
        );
        console.log(
          `✅ LLM selected category: ${selectedCategory?.name} (${selectedCategoryId})`
        );
        return selectedCategoryId;
      } else {
        console.log(
          `⚠️ LLM returned invalid category ID: ${selectedCategoryId}, will use first valid category`
        );
        // Fallback: use first valid category as last resort
        return validCategories[0]?.id || null;
      }
    } catch (error) {
      console.error(
        `❌ Error determining category from name "${productName}":`,
        error
      );
      // Last resort: return null (will be handled by caller)
      return null;
    }
  }

  /**
   * Get all leaf categories (categories without children) from category tree
   */
  private getLeafCategories(categories: CategoryNode[]): CategoryNode[] {
    const leafCategories: CategoryNode[] = [];

    const traverse = (nodes: CategoryNode[]) => {
      for (const node of nodes) {
        if (node.children.length === 0) {
          leafCategories.push(node);
        } else {
          traverse(node.children);
        }
      }
    };

    traverse(categories);
    return leafCategories;
  }
}
