import { prisma } from '../db-node';

export interface ImageColorMapping {
  imageUrl: string;
  color: string | null;
  imageId?: string;
}

export class FixedColorMappingService {
  /**
   * Normalize color names to Russian lowercase
   */
  private normalizeColorToRussian(color: string | null): string | null {
    if (!color) return null;

    const colorLower = color.toLowerCase().trim();

    // English to Russian mapping
    const englishToRussian: Record<string, string> = {
      black: 'черный',
      white: 'белый',
      red: 'красный',
      blue: 'синий',
      green: 'зелёный',
      yellow: 'желтый',
      orange: 'оранжевый',
      brown: 'коричневый',
      gray: 'серый',
      grey: 'серый',
      pink: 'розовый',
      purple: 'фиолетовый',
      violet: 'фиолетовый',
      beige: 'бежевый',
      burgundy: 'бордовый',
      navy: 'синий',
      tan: 'бежевый',
    };

    // Check if it's an English color
    if (englishToRussian[colorLower]) {
      return englishToRussian[colorLower];
    }

    // If it's already Russian, just ensure lowercase
    return colorLower;
  }
  /**
   * Update product images with proper color mapping
   * Maps each image to its specific detected color
   */
  async updateProductImagesWithColorMapping(
    productId: string,
    imageColorMappings: ImageColorMapping[] | Map<string, string | null>
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
      `🎨 Updating product ${productId} with proper color mapping:`,
      imageColorMappings
    );

    // Create a mapping from image URL to color
    const urlToColorMap = new Map<string, string | null>();

    if (Array.isArray(imageColorMappings)) {
      imageColorMappings.forEach(mapping => {
        urlToColorMap.set(mapping.imageUrl, mapping.color);
      });
    } else {
      // It's already a Map
      for (const [url, color] of imageColorMappings.entries()) {
        urlToColorMap.set(url, color);
      }
    }

    let updatedCount = 0;
    const sortedImages = product.images.sort(
      (a: any, b: any) => a.sort - b.sort
    );

    console.log(`📸 Found ${sortedImages.length} product images to update`);

    // Convert Map to array for index-based access
    const colorEntries = Array.from(urlToColorMap.entries());

    for (let i = 0; i < sortedImages.length; i++) {
      const image = sortedImages[i];
      let detectedColor: string | null = null;

      // Strategy 1: Try to match by exact URL
      if (urlToColorMap.has(image.url)) {
        detectedColor = urlToColorMap.get(image.url) || null;
        console.log(
          `  🔗 Exact URL match for image ${i + 1}: ${detectedColor}`
        );
      } else {
        // Strategy 2: Try to find by partial URL matching
        for (const [originalUrl, color] of urlToColorMap.entries()) {
          if (this.isUrlMatch(image.url, originalUrl)) {
            detectedColor = color;
            console.log(
              `  🎯 URL pattern match for image ${i + 1}: ${detectedColor}`
            );
            break;
          }
        }
      }

      // Strategy 3: Index-based fallback (assumes images are in same order)
      if (!detectedColor && i < colorEntries.length) {
        detectedColor = colorEntries[i][1];
        console.log(
          `  📋 Index-based mapping for image ${i + 1}: ${detectedColor}`
        );
      }

      // Strategy 4: Use first available color as last resort
      if (!detectedColor && colorEntries.length > 0) {
        detectedColor = colorEntries[0][1];
        console.log(`  🎯 Fallback color for image ${i + 1}: ${detectedColor}`);
      }

      if (detectedColor) {
        // Normalize color to Russian lowercase
        const normalizedColor = this.normalizeColorToRussian(detectedColor);

        await prisma.productImage.update({
          where: { id: image.id },
          data: { color: normalizedColor },
        });
        updatedCount++;
        console.log(
          `  ✅ Updated image ${image.id} (sort: ${image.sort}) with color: ${detectedColor} → ${normalizedColor}`
        );
      } else {
        console.log(
          `  ⚠️  No color found for image ${image.id} (URL: ${image.url})`
        );
      }
    }

    // Update product batch processing status
    await prisma.product.update({
      where: { id: product.id },
      data: {
        batchProcessingStatus: 'colors_complete',
      },
    });

    console.log(
      `✅ Updated product ${product.id} with color mapping: ${updatedCount}/${sortedImages.length} images updated`
    );
  }

  /**
   * Check if two URLs match (handles S3 URL transformations)
   */
  private isUrlMatch(imageUrl: string, originalUrl: string): boolean {
    // Extract filename from both URLs
    const getFilename = (url: string) => {
      try {
        const urlObj = new URL(url);
        return urlObj.pathname.split('/').pop() || '';
      } catch {
        return url.split('/').pop() || '';
      }
    };

    const imageFilename = getFilename(imageUrl);
    const originalFilename = getFilename(originalUrl);

    // Strategy 1: Exact filename match
    if (imageFilename === originalFilename && imageFilename !== '') {
      return true;
    }

    // Strategy 2: Extract UUIDs from both URLs and compare
    const extractUuid = (url: string) => {
      // Original URL format: https://sw-media-1105.storage.yandexcloud.net/1105334583/{uuid}.jpg
      // S3 URL format: https://storage.yandexcloud.net/marinaobuv-photos-new/products/{productId}/{timestamp}-{random}.jpeg

      // For original URLs, extract the UUID part
      if (url.includes('sw-media-1105.storage.yandexcloud.net')) {
        const match = url.match(/\/([a-f0-9-]{36})\./);
        return match ? match[1] : null;
      }

      // For S3 URLs, we can't easily extract the original UUID, so return null
      return null;
    };

    const originalUuid = extractUuid(originalUrl);
    if (originalUuid) {
      // If we have the original UUID, check if the S3 URL was generated from this original
      // This is a heuristic approach - we'll use index-based matching as fallback
      return false; // Let the index-based matching handle this
    }

    return false;
  }

  /**
   * Extract colors from analysis results with proper URL mapping
   */
  extractColorMappingsFromAnalysis(
    analysisResults: any[]
  ): ImageColorMapping[] {
    const mappings: ImageColorMapping[] = [];

    for (const result of analysisResults) {
      if (result.imageUrl && result.colors && Array.isArray(result.colors)) {
        // Take the first color as the primary color for this image
        const primaryColor = result.colors[0] || null;

        mappings.push({
          imageUrl: result.imageUrl,
          color: primaryColor,
        });

        console.log(
          `🎨 Mapped image ${result.imageUrl} to color: ${primaryColor}`
        );
      }
    }

    return mappings;
  }
}
