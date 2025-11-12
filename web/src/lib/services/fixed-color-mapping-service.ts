import { prisma } from '../db-node';
import { normalizeColorToRussian } from '@/lib/utils/color-normalization';

export interface ImageColorMapping {
  imageUrl: string;
  color: string | null;
  imageId?: string;
  originalImageIndex?: number; // Original index in the message order (matches product image sort field)
}

export class FixedColorMappingService {
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
    console.log(
      `📸 Product image sort values:`,
      sortedImages.map((img: any, idx: number) => `image[${idx}]: sort=${img.sort}`).join(', ')
    );

    // Create a map from originalImageIndex to color for reliable matching
    const indexToColorMap = new Map<number, string | null>();
    if (Array.isArray(imageColorMappings)) {
      imageColorMappings.forEach(mapping => {
        if (mapping.originalImageIndex !== undefined) {
          indexToColorMap.set(mapping.originalImageIndex, mapping.color);
        }
      });
      console.log(
        `🎯 Created index-to-color map with ${indexToColorMap.size} entries:`,
        Array.from(indexToColorMap.entries()).map(([idx, color]) => `[${idx}]=${color}`).join(', ')
      );
    }

    // Convert Map to array for index-based access (fallback)
    const colorEntries = Array.from(urlToColorMap.entries());

    for (let i = 0; i < sortedImages.length; i++) {
      const image = sortedImages[i];
      let detectedColor: string | null = null;

      // Strategy 1: Match by originalImageIndex (most reliable - matches product image sort field)
      // Product images are created with sort: i where i is the index in message order
      // This matches the originalImageIndex stored in analysis results
      if (indexToColorMap.has(image.sort)) {
        detectedColor = indexToColorMap.get(image.sort) || null;
        console.log(
          `  🎯 Index-based match (sort: ${image.sort}) for image ${i + 1}: ${detectedColor}`
        );
      }

      // Strategy 2: Try to match by exact URL
      if (!detectedColor && urlToColorMap.has(image.url)) {
        detectedColor = urlToColorMap.get(image.url) || null;
        console.log(
          `  🔗 Exact URL match for image ${i + 1}: ${detectedColor}`
        );
      } else if (!detectedColor) {
        // Strategy 3: Try to find by partial URL matching
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

      // Strategy 4: Index-based fallback (only if no index mapping available)
      // This assumes images are in same order, but is less reliable
      if (!detectedColor && indexToColorMap.size === 0 && i < colorEntries.length) {
        detectedColor = colorEntries[i][1];
        console.log(
          `  📋 Index-based fallback mapping for image ${i + 1}: ${detectedColor}`
        );
      }

      // Strategy 5: Use first available color as last resort
      if (!detectedColor && colorEntries.length > 0) {
        detectedColor = colorEntries[0][1];
        console.log(`  🎯 Fallback color for image ${i + 1}: ${detectedColor}`);
      }

      if (detectedColor) {
        // Normalize color to Russian lowercase
        const normalizedColor = normalizeColorToRussian(detectedColor);

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
   * Preserves original image index for reliable matching with product images
   */
  extractColorMappingsFromAnalysis(
    analysisResults: any[]
  ): ImageColorMapping[] {
    const mappings: ImageColorMapping[] = [];

    for (const result of analysisResults) {
      if (result.imageUrl && result.color !== undefined) {
        // Take the single color for this image
        const primaryColor = result.color;

        mappings.push({
          imageUrl: result.imageUrl,
          color: primaryColor,
          originalImageIndex: result.originalImageIndex, // Preserve original index for matching
        });

        console.log(
          `🎨 Mapped image ${result.originalImageIndex !== undefined ? `[index ${result.originalImageIndex}] ` : ''}${result.imageUrl} to color: ${primaryColor}`
        );
      } else {
        // Even if color is null, preserve the mapping with original index
        if (result.imageUrl && result.originalImageIndex !== undefined) {
          mappings.push({
            imageUrl: result.imageUrl,
            color: null,
            originalImageIndex: result.originalImageIndex,
          });
          console.log(
            `🎨 Mapped image [index ${result.originalImageIndex}] ${result.imageUrl} to color: null (no color detected)`
          );
        }
      }
    }

    return mappings;
  }
}
