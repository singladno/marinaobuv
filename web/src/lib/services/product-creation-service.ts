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
   * Map AI gender response to valid Prisma enum values
   */
  private mapGender(
    aiGender: string | undefined | null
  ): 'MALE' | 'FEMALE' | 'UNISEX' {
    if (!aiGender) return 'UNISEX';
    const gender = aiGender.toUpperCase();

    // Handle common English variants
    if (
      gender === 'MALE' ||
      gender.includes('MEN') ||
      gender.includes('MAN') ||
      gender === 'M'
    ) {
      return 'MALE';
    }
    if (
      gender === 'FEMALE' ||
      gender.includes('WOMEN') ||
      gender.includes('WOMAN') ||
      gender === 'F'
    ) {
      return 'FEMALE';
    }

    // Handle Russian variants
    if (gender.includes('МУЖ')) {
      return 'MALE';
    }
    if (gender.includes('ЖЕН')) {
      return 'FEMALE';
    }
    if (gender.includes('ЮНИСЕКС') || gender.includes('UNISEX')) {
      return 'UNISEX';
    }

    // Default
    console.log(`   ⚠️  Unknown gender "${aiGender}", defaulting to UNISEX`);
    return 'UNISEX';
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
      console.log(
        `   🔍 Category analysis: categoryId=${analysis.categoryId}, newCategory=${JSON.stringify(analysis.newCategory)}`
      );

      if (analysis.newCategory) {
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

      // Validate categoryId exists if provided
      if (finalCategoryId) {
        try {
          const categoryExists = await prisma.category.findUnique({
            where: { id: finalCategoryId },
            select: { id: true },
          });
          if (!categoryExists) {
            console.log(
              `   ⚠️  Category ID ${finalCategoryId} not found, setting to null`
            );
            finalCategoryId = null;
          }
        } catch (error) {
          console.error(
            `   ❌ Error validating category ID ${finalCategoryId}:`,
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
          gender: this.mapGender(analysis.gender),
          season: this.mapSeason(analysis.season),
          description: analysis.description,
          material: analysis.material,
          sizes: analysis.sizes, // Store sizes as JSON
          color:
            analysis.colors && analysis.colors.length > 0
              ? analysis.colors[0]
              : null,
          providerDiscount: analysis.providerDiscount || null,
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
      console.log(
        `   🎨 Available image colors: ${JSON.stringify(analysis.imageColors, null, 2)}`
      );

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        console.log(
          `   🔍 Looking for color for image ${i}: ${image.url.substring(0, 50)}...`
        );

        // Find the color for this specific image URL from per-image analysis
        // Try exact match first
        let imageColorResult = analysis.imageColors?.find(
          ic => ic.url === image.url
        );

        // If no exact match, try to match by index (since images are processed in order)
        if (
          !imageColorResult &&
          analysis.imageColors &&
          i < analysis.imageColors.length
        ) {
          imageColorResult = analysis.imageColors[i];
          console.log(
            `   🔄 Using color by index ${i}: ${imageColorResult.color}`
          );
        }

        const imageColor = imageColorResult?.color || null;

        console.log(`   🎨 Found color: '${imageColor}' for image ${i}`);

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
    console.log(
      `   🔍 Creating new category: ${newCategory.name} under parent ${newCategory.parentCategoryId}`
    );

    // First, verify the parent category exists
    const parentCategory = await prisma.category.findUnique({
      where: { id: newCategory.parentCategoryId },
      select: { id: true, path: true },
    });

    if (!parentCategory) {
      console.error(
        `   ❌ Parent category with ID ${newCategory.parentCategoryId} not found`
      );

      // Try to find a root category to use as parent
      const rootCategory = await prisma.category.findFirst({
        where: { parentId: null },
        select: { id: true, path: true },
      });

      if (rootCategory) {
        console.log(
          `   🔄 Using root category as parent: ${rootCategory.path} (${rootCategory.id})`
        );
        newCategory.parentCategoryId = rootCategory.id;

        // Re-fetch the parent category after updating the ID
        const updatedParentCategory = await prisma.category.findUnique({
          where: { id: newCategory.parentCategoryId },
          select: { id: true, path: true },
        });

        if (!updatedParentCategory) {
          throw new Error(`Failed to find root category after update`);
        }

        // Create the new category path
        const newPath = `${updatedParentCategory.path}/${newCategory.slug}`;

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
          `Created new category: ${newCategoryRecord.name} (${newCategoryRecord.id}) under parent ${updatedParentCategory.path}`
        );

        return newCategoryRecord.id;
      } else {
        throw new Error(
          `Parent category with ID ${newCategory.parentCategoryId} not found and no root category available`
        );
      }
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
