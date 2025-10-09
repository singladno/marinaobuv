/**
 * Service for analyzing individual images to detect colors
 */
import { env } from '../env';
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

      const systemPrompt = `You are an image color detection assistant for a shoe catalog.
Given a list of images, your ONLY task is: for EACH image, return the color of the shoe shown in that image.

Rules:
- Use short Russian color names: "черный", "белый", "бежевый", "синий", "красный", "коричневый", "серый", "зелёный", "розовый", "фиолетовый", "бордовый".
- If the color is unclear, return null for that image's color.
- Maintain the exact input order of images.
- Return STRICT JSON with this shape:
  { "images": [ { "color": "черный" | null }, ... ] }
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
                this.getOpenAI().then(client =>
                  client.responses.create({
                    model: ModelConfigService.getModelForTask('color'),
                    input: userMessage.content[0].text,
                    reasoning: {
                      effort:
                        ModelConfigService.getReasoningEffortForTask('color'),
                    },
                    text: {
                      verbosity:
                        ModelConfigService.getTextVerbosityForTask('color'),
                    },
                    max_output_tokens:
                      ModelConfigService.getMaxOutputTokensForTask('color'),
                  })
                )
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

            // Apply results to original positions
            indices.forEach((originalIdx, i) => {
              const imageResult = result.images?.[i];
              colorResults[originalIdx] = {
                url: imageUrls[originalIdx],
                color:
                  imageResult?.color && imageResult.color.trim()
                    ? imageResult.color.trim()
                    : null,
              };
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
