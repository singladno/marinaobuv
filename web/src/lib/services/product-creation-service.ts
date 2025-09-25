import { prisma } from '../db-node';
import { AnalysisResult } from './unified-analysis-service';
import { ImageData } from './image-processing-service';

/**
 * Service for creating draft products from analysis results
 */
export class ProductCreationService {
  /**
   * Map AI season response to valid Prisma enum values
   */
  private mapSeason(
    aiSeason: string
  ): 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER' {
    const season = aiSeason.toUpperCase();

    // Handle common variations
    if (
      season.includes('DEMISAISON') ||
      season.includes('DEMI_SEASON') ||
      season.includes('DEMI-SEASON')
    ) {
      return 'AUTUMN'; // Demi-season is typically autumn/fall
    }
    if (season.includes('SPRING') || season.includes('ВЕСНА')) {
      return 'SPRING';
    }
    if (season.includes('SUMMER') || season.includes('ЛЕТО')) {
      return 'SUMMER';
    }
    if (
      season.includes('AUTUMN') ||
      season.includes('FALL') ||
      season.includes('ОСЕНЬ')
    ) {
      return 'AUTUMN';
    }
    if (season.includes('WINTER') || season.includes('ЗИМА')) {
      return 'WINTER';
    }

    // Default to AUTUMN for unknown seasons
    console.log(`   ⚠️  Unknown season "${aiSeason}", defaulting to AUTUMN`);
    return 'AUTUMN';
  }

  /**
   * Get or create provider for phone number
   */
  private async getOrCreateProvider(
    phoneNumber: string,
    fromName: string
  ): Promise<string> {
    // First, try to find existing provider by phone
    let provider = await prisma.provider.findFirst({
      where: { phone: phoneNumber },
    });

    if (!provider) {
      // Create new provider if not found
      provider = await prisma.provider.create({
        data: {
          name: fromName || `Provider ${phoneNumber}`,
          phone: phoneNumber,
          place: 'Unknown',
        },
      });
      console.log(
        `   🏢 Created new provider: ${provider.name} (${phoneNumber})`
      );
    }

    return provider.id;
  }

  /**
   * Create draft product from analysis result
   */
  async createDraftProductFromAnalysis(
    messageId: string,
    from: string,
    fromName: string,
    analysis: AnalysisResult,
    images: ImageData[],
    context: string,
    sourceMessageIds: string[] = []
  ): Promise<void> {
    try {
      console.log(`   📦 Analysis result: ${analysis.name}`);
      console.log(`   💰 Price: ${analysis.price} ${analysis.currency}`);
      console.log(`   👥 Gender: ${analysis.gender}`);
      console.log(`   🌟 Season: ${analysis.season}`);
      console.log(`   📏 Sizes: ${analysis.sizes.join(', ')}`);
      console.log(`   🎨 Colors: ${analysis.colors.join(', ')}`);

      // Get or create provider
      const providerId = await this.getOrCreateProvider(from, fromName);

      // Handle new category creation if needed
      let finalCategoryId = analysis.categoryId;
      if (analysis.newCategory && !analysis.categoryId) {
        try {
          finalCategoryId = await this.createNewCategory(analysis.newCategory);
          console.log(
            `   📁 Created new category: ${analysis.newCategory.name} (${finalCategoryId})`
          );
        } catch (error) {
          console.error(
            `   ❌ Failed to create new category: ${analysis.newCategory.name}`,
            error
          );
          finalCategoryId = null;
        }
      }

      // Create draft product
      const draftProduct = await prisma.waDraftProduct.create({
        data: {
          messageId,
          providerId,
          name: analysis.name,
          pricePair: analysis.price,
          currency: analysis.currency,
          gender: analysis.gender,
          season: this.mapSeason(analysis.season),
          description: analysis.description,
          material: analysis.material,
          sizes: analysis.sizes, // Store sizes as JSON
          color:
            analysis.colors && analysis.colors.length > 0
              ? analysis.colors[0]
              : null,
          categoryId: finalCategoryId,
          status: 'PENDING',
          aiStatus: 'PROCESSED',
          aiConfidence: 0.9,
          aiContext: context,
          source: sourceMessageIds, // Store all source message IDs
        },
      });

      console.log(`   📦 Creating draft product: ${analysis.name}`);
      console.log(`   ✅ Draft product created successfully!`);
      console.log(
        `   📊 Created draft product ${draftProduct.id} with ${images.length} images`
      );

      // Create draft product images with individual colors
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        // Find the color for this specific image URL from per-image analysis
        const imageColorResult = analysis.imageColors?.find(
          ic => ic.url === image.url
        );
        const imageColor = imageColorResult?.color || null;

        await prisma.waDraftProductImage.create({
          data: {
            draftProductId: draftProduct.id,
            url: image.url,
            key: image.key,
            mimeType: image.mimeType,
            width: image.width,
            height: image.height,
            sort: i,
            isPrimary: i === 0,
            color: imageColor,
          },
        });
      }

      // Sizes are stored as JSON in the sizes field above
    } catch (error) {
      console.error('Error creating draft product:', error);
      throw error;
    }
  }

  /**
   * Create a new category
   */
  private async createNewCategory(newCategory: {
    name: string;
    slug: string;
    parentCategoryId: string;
  }): Promise<string> {
    // First, verify the parent category exists
    const parentCategory = await prisma.category.findUnique({
      where: { id: newCategory.parentCategoryId },
      select: { id: true, path: true },
    });

    if (!parentCategory) {
      throw new Error(
        `Parent category with ID ${newCategory.parentCategoryId} not found`
      );
    }

    // Create the new category path
    const newPath = `${parentCategory.path}/${newCategory.slug}`;

    // Check if category with this path already exists
    const existingCategory = await prisma.category.findUnique({
      where: { path: newPath },
    });

    if (existingCategory) {
      console.log(
        `Category with path ${newPath} already exists, using existing ID: ${existingCategory.id}`
      );
      return existingCategory.id;
    }

    // Create the new category
    const newCategoryRecord = await prisma.category.create({
      data: {
        name: newCategory.name,
        slug: newCategory.slug,
        path: newPath,
        parentId: newCategory.parentCategoryId,
        isActive: true,
        sort: 500, // Default sort value
      },
    });

    console.log(
      `Created new category: ${newCategoryRecord.name} (${newCategoryRecord.id}) under parent ${parentCategory.path}`
    );

    return newCategoryRecord.id;
  }
}
