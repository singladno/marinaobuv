/**
 * Service for analyzing individual images to detect colors
 */
import { env } from '../env';
import { normalizeColorToRussian } from '@/lib/utils/color-normalization';
import OpenAI from 'openai';
import { ModelConfigService } from './model-config-service';
import { withRetry, sleep } from '../../utils/retry';

export interface ImageColorResult {
  url: string;
  color: string | null;
}

export class PerImageColorService {
  private openai: any;

  constructor() {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required');
    }

    // Initialize OpenAI lazily
    this.openai = null;
  }

  private async getOpenAI() {
    if (!this.openai) {
      const rawBase = env.OPENAI_BASE_URL || 'https://api.openai.com';
      const normalizedBase = rawBase.endsWith('/v1')
        ? rawBase
        : `${rawBase.replace(/\/+$/, '')}/v1`;
      this.openai = new OpenAI({
        apiKey: env.OPENAI_API_KEY,
        baseURL: normalizedBase,
      });
    }
    return this.openai;
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

      const concurrency = env.IMAGE_DOWNLOAD_CONCURRENCY || 4;
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

      if (successfulImages.length === 0) {
        console.log(
          `   ⚠️  No images could be downloaded, returning null colors`
        );
        return imageUrls.map(url => ({ url, color: null }));
      }

      console.log(
        `   ✅ Successfully downloaded ${successfulImages.length}/${imageUrls.length} images`
      );

      const systemPrompt = `You are a shoe color analysis expert for a shoe catalog.
Your ONLY task is to identify the MAIN/PRIMARY color of the shoe's main material/canvas, ignoring decorative elements.

CRITICAL RULES:
- Focus ONLY on the shoe's main body material (upper, canvas, leather, fabric)
- IGNORE decorative elements like logos, stitching, laces, soles, heels, buckles, zippers
- IGNORE background colors, lighting, shadows, reflections, or any other objects
- IGNORE the color of the surface the shoe is on (floor, table, etc.)
- IGNORE any text, labels, or packaging in the image
- IGNORE small colored details, patterns, or accents
- Look for the dominant color of the shoe's main material/upper
- If there are multiple shoes, analyze the most prominent one
- If the shoe has multiple colors, identify the MAIN material color (not decorative accents)
- If the main shoe color is unclear or not visible, return null for that image

EXAMPLES:
- Black shoe with white laces and white sole → "черный" (main material)
- Red sneaker with white logo and white sole → "красный" (main canvas)
- Brown boot with silver buckles → "коричневый" (main leather)
- Blue shoe with yellow stitching → "синий" (main material)

Use ONLY Russian color names in lowercase: "черный", "белый", "бежевый", "синий", "красный", "коричневый", "серый", "зелёный", "розовый", "фиолетовый", "бордовый", "желтый", "оранжевый", "магнета", "фуксия".

CRITICAL: NEVER use English color names like "black", "white", "red", "blue" - ONLY Russian names in lowercase.

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

            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(
                () => reject(new Error('Request timeout after 90 seconds')),
                90000
              );
            });

            // no per-request artificial delays; retries handle rate limits

            const userMessage = {
              role: 'user' as const,
              content: [
                {
                  type: 'text',
                  text: `Analyze these ${batch.length} images for color detection:`,
                },
                ...batch.map(img => ({
                  type: 'image_url',
                  image_url: { url: img.base64 },
                })),
              ],
            };

            const response = (await Promise.race([
              withRetry(signal =>
                this.getOpenAI().then(client => {
                  const model = ModelConfigService.getModelForTask('color');
                  const payload: any = {
                    model,
                    input:
                      (userMessage.content.find(c => c.type === 'text') as any)
                        ?.text || '',
                    max_output_tokens:
                      ModelConfigService.getMaxOutputTokensForTask('color'),
                  };
                  if (ModelConfigService.supportsReasoning(model)) {
                    payload.reasoning = {
                      effort:
                        ModelConfigService.getReasoningEffortForTask('color'),
                    };
                  }
                  if (ModelConfigService.supportsTextControls(model)) {
                    payload.text = {
                      verbosity:
                        ModelConfigService.getTextVerbosityForTask('color'),
                    };
                  }
                  return client.responses.create(payload);
                })
              ),
              timeoutPromise,
            ])) as any;

            const content = response.output_text;
            if (!content) {
              throw new Error('No content in OpenAI response');
            }
            const result = JSON.parse(content) as {
              images?: Array<{ color?: string | null }>;
            };

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

              // Normalize color to Russian lowercase
              const normalizedColor = normalizeColorToRussian(rawColor);

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
        if (lastError) throw lastError;
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
        await processBatch(batches[i], indexBatches[i]);
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
