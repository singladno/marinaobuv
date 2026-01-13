/**
 * Service for analyzing individual images to detect colors
 */
import {
  normalizeToStandardColor,
  getStandardColors,
} from '@/lib/constants/colors';
import { Groq } from 'groq-sdk';
import { getGroqConfig } from '@/lib/groq-proxy-config';
import { groqChatCompletion } from './groq-api-wrapper';
import { ModelConfigService } from './model-config-service';
import { sleep } from '../../utils/retry';

export interface ImageColorResult {
  url: string;
  color: string | null;
}

export class PerImageColorService {
  private groq: Groq | null = null;

  private async initializeGroq(): Promise<Groq> {
    if (!this.groq) {
      // Use same pattern as WA parser: proxy in prod, direct in dev
      if (process.env.NODE_ENV === 'production') {
        const groqConfig = await getGroqConfig();
        this.groq = new Groq(groqConfig);
      } else {
        this.groq = new Groq({
          apiKey: process.env.GROQ_API_KEY,
        });
      }
    }
    return this.groq;
  }

  /**
   * Download image from URL and convert to base64
   */
  private async downloadImageAsBase64(url: string): Promise<string | null> {
    try {
      console.log(`   📥 Downloading image: ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MarinaObuv/1.0)',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/jpeg';

      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error(`   ❌ Failed to download image ${url}:`, error);
      return null;
    }
  }

  private async downloadImageBuffer(url: string): Promise<Buffer | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MarinaObuv/1.0)' },
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error(`   ❌ Failed to download image buffer ${url}:`, error);
      return null;
    }
  }

  /**
   * Analyze each image individually to determine its color (LLM-based)
   */
  async analyzeImageColors(imageUrls: string[]): Promise<ImageColorResult[]> {
    if (imageUrls.length === 0) {
      return [];
    }

    try {
      console.log(
        `   🎨 Analyzing colors for ${imageUrls.length} images individually...`
      );

      // Download all images as base64 first with limited concurrency
      const imageData: Array<{ url: string; base64: string | null }> =
        Array.from({ length: imageUrls.length }, () => ({
          url: '',
          base64: null,
        }));

      const concurrency =
        parseInt(process.env.IMAGE_DOWNLOAD_CONCURRENCY || '4', 10) || 4;
      let index = 0;

      const worker = async () => {
        while (index < imageUrls.length) {
          const current = index++;
          const url = imageUrls[current];
          console.log(
            `   📥 Downloading image ${current + 1}/${imageUrls.length}...`
          );
          const base64 = await this.downloadImageAsBase64(url);
          imageData[current] = { url, base64 };
        }
      };

      const workers = Array.from(
        { length: Math.min(concurrency, imageUrls.length) },
        () => worker()
      );
      await Promise.all(workers);

      // Filter out failed downloads
      const successfulImages = imageData.filter(img => img.base64 !== null);
      const failedImages = imageData.filter(img => img.base64 === null);

      if (failedImages.length > 0) {
        console.error(
          `   ⚠️  Failed to download ${failedImages.length} images:`,
          failedImages.map(img => img.url)
        );
      }

      if (successfulImages.length === 0) {
        console.error(
          `   ❌ No images could be downloaded, returning null colors for all ${imageUrls.length} images`
        );
        return imageUrls.map(url => ({ url, color: null }));
      }

      console.log(
        `   ✅ Successfully downloaded ${successfulImages.length}/${imageUrls.length} images`
      );

      const systemPrompt = `You are a product color analysis expert for an e-commerce catalog.
Your ONLY task is to identify the MAIN/PRIMARY color of the product shown in the image, regardless of product type (shoes, clothing, accessories, bags, etc.).

CRITICAL RULES:
- Focus on the MAIN/PRIMARY color of the product's main material/fabric/surface
- Identify the dominant color that covers the largest area of the product
- IGNORE decorative elements: logos, patterns, stitching, buttons, zippers, buckles, laces, soles, labels, text
- IGNORE background colors, lighting, shadows, reflections, or any other objects in the image
- IGNORE the color of surfaces the product is on (floor, table, mannequin, display stand, etc.)
- IGNORE any text, labels, tags, or packaging visible in the image
- IGNORE small colored details, accents, or patterns
- If there are multiple products, analyze the most prominent/central one
- If the product has multiple colors, identify the MAIN/dominant color (not decorative accents)
- If the main product color is unclear, not visible, or the image doesn't show a product clearly, return null

EXAMPLES (any product type):
- Black shoe with white laces → "черный" (main material)
- Red bag with gold hardware → "красный" (main material)
- Blue jacket with white logo → "синий" (main fabric)
- White dress with colored belt → "белый" (main fabric)
- Brown leather item with silver details → "коричневый" (main material)
- Gray accessory with black trim → "серый" (main color)

Use ONLY these standard Russian color names in lowercase: ${getStandardColors().join(', ')}.

CRITICAL:
- NEVER use English color names like "black", "white", "red", "blue" - ONLY Russian names in lowercase
- NEVER use compound colors like "синий с желтым" - only specify the MAIN color
- If the product has multiple colors, use "разноцветный"
- If the color doesn't match any standard color, return null

Return STRICT JSON with this shape:
  { "images": [ { "color": "черный" | null }, ... ] }
- CRITICAL: Return colors in the EXACT SAME ORDER as the input images
- The first color in the array corresponds to the first image, second to second, etc.
- Do NOT include explanations or any extra fields.`;

      // Configurable batching: send images one-by-one by default
      const batchSizeEnv = process.env.MAX_COLOR_IMAGES_PER_CALL;
      const batchSize = batchSizeEnv ? parseInt(batchSizeEnv, 10) || 1 : 1;

      // Prepare result array in original order
      const colorResults: ImageColorResult[] = imageUrls.map(url => ({
        url,
        color: null,
      }));

      // Helper to process a single batch with retry
      const processBatch = async (
        batch: Array<{ url: string; base64: string }>,
        indices: number[]
      ) => {
        const maxRetries = 2;
        let lastError: any = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(
              `   🔄 Color analysis batch attempt ${attempt}/${maxRetries} (size=${batch.length})...`
            );

            if (attempt > 1) {
              const delayMs = Math.min(10_000, 500 * 2 ** (attempt - 2));
              console.log(
                `   ⏳ Backoff ${delayMs}ms before color analysis...`
              );
              await sleep(delayMs);
            }

            // Use Groq chat completions API (same as WA parser) with JSON mode
            const groq = await this.initializeGroq();
            const model = ModelConfigService.getModelForTask('color');

            const response = await groqChatCompletion(
              groq,
              {
                model,
                messages: [
                  {
                    role: 'system',
                    content: systemPrompt,
                  },
                  {
                    role: 'user',
                    content: [
                      {
                        type: 'text',
                        text: `Analyze these ${batch.length} images for color detection:`,
                      },
                      ...batch.map((img, idx) => {
                        const base64Preview = img.base64.substring(0, 50);
                        console.log(
                          `   📸 Image ${idx + 1} base64 preview: ${base64Preview}... (total length: ${img.base64.length})`
                        );
                        return {
                          type: 'image_url' as const,
                          image_url: { url: img.base64 },
                        };
                      }),
                    ],
                  },
                ],
                response_format: { type: 'json_object' }, // Force JSON output
                temperature: 0.5,
                max_tokens:
                  ModelConfigService.getMaxOutputTokensForTask('color'),
              },
              `color-analysis-batch-${indices.join('-')}`,
              {
                maxRetries: 2,
                baseDelayMs: 500,
                maxDelayMs: 10000,
                timeoutMs: 90000,
              }
            );

            // Type guard: ensure it's ChatCompletion, not Stream
            if (!('choices' in response)) {
              throw new Error('Unexpected response type from Groq API');
            }

            const content = response.choices[0].message.content;
            if (!content) {
              throw new Error('No content in Groq response');
            }

            console.log(
              `   📋 Raw Groq color analysis response (first 500 chars):`,
              content.substring(0, 500)
            );

            let result: { images?: Array<{ color?: string | null }> };
            try {
              result = JSON.parse(content) as {
                images?: Array<{ color?: string | null }>;
              };
              console.log(
                `   📋 Parsed color analysis result:`,
                JSON.stringify(result, null, 2)
              );
            } catch (parseError) {
              console.error(
                `   ❌ Failed to parse color analysis JSON:`,
                parseError,
                `\n   Raw content:`,
                content
              );
              throw parseError;
            }

            // Validate that we got the right number of results
            if (!result.images || result.images.length !== indices.length) {
              console.error(
                `   ❌ Color analysis returned ${result.images?.length || 0} results but expected ${indices.length}`
              );
              console.error(`   📊 Expected indices: [${indices.join(', ')}]`);
              console.error(`   📊 Received results:`, result.images);
              throw new Error(
                `Color analysis returned ${result.images?.length || 0} results but expected ${indices.length}`
              );
            }

            // Apply results to original positions
            console.log(
              `   🔍 Mapping ${result.images.length} color results to ${indices.length} images`
            );
            indices.forEach((originalIdx, i) => {
              const imageResult = result.images?.[i];
              const rawColor =
                imageResult?.color && imageResult.color.trim()
                  ? imageResult.color.trim()
                  : null;

              // Normalize color to standard color
              const normalizedColor = normalizeToStandardColor(rawColor);

              colorResults[originalIdx] = {
                url: imageUrls[originalIdx],
                color: normalizedColor,
              };

              console.log(
                `   🎨 Image ${originalIdx + 1}: ${rawColor} → ${normalizedColor || 'null'}`
              );
            });

            return; // batch done
          } catch (error) {
            lastError = error;
            console.error(
              `   ❌ Color analysis batch attempt ${attempt} failed:`,
              error
            );
            if (attempt < maxRetries) {
              const waitMs = Math.min(60_000, 1000 * 2 ** (attempt - 1));
              console.log(
                `   ⏳ Waiting ${waitMs}ms before retrying color analysis batch...`
              );
              await sleep(waitMs);
            }
          }
        }
        // If all attempts failed for this batch, leave colors as null for these indices
        if (lastError) {
          console.error(
            `   ❌ All retries failed for batch [${indices.join(', ')}]. Leaving colors as null. Last error:`,
            lastError
          );
          // Don't throw - just leave colors as null for this batch
          return;
        }
      };

      // Build batches from successful images
      const batches: Array<Array<{ url: string; base64: string }>> = [];
      const indexBatches: Array<number[]> = [];
      let tmp: Array<{ url: string; base64: string }> = [];
      let tmpIdx: number[] = [];
      successfulImages.forEach((img, idx) => {
        tmp.push({ url: img.url, base64: img.base64! });
        // map back to original index
        const originalIdx = imageUrls.findIndex(u => u === img.url);
        tmpIdx.push(originalIdx);
        if (tmp.length === Math.max(1, batchSize)) {
          batches.push(tmp);
          indexBatches.push(tmpIdx);
          tmp = [];
          tmpIdx = [];
        }
      });
      if (tmp.length) {
        batches.push(tmp);
        indexBatches.push(tmpIdx);
      }

      // Process batches sequentially to control TPM
      for (let i = 0; i < batches.length; i++) {
        console.log(
          `   🎯 Processing color batch ${i + 1}/${batches.length} (size=${batches[i].length})`
        );
        try {
          await processBatch(batches[i], indexBatches[i]);
        } catch (batchError) {
          console.error(
            `   ❌ Batch ${i + 1} failed completely, leaving colors as null for these images:`,
            indexBatches[i],
            batchError
          );
          // Colors are already null for these indices, so we just continue
        }
      }

      console.log(
        `   ✅ Color analysis completed for ${imageUrls.length} images (batched)`
      );
      return colorResults;
    } catch (error) {
      console.error('Error analyzing image colors:', error);

      // Return null colors for all images if analysis fails
      return imageUrls.map(url => ({ url, color: null }));
    }
  }
}
