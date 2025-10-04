/**
 * Service for analyzing individual images to detect colors
 */
import { env } from '../env';

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
      const { default: OpenAI } = await import('openai');
      this.openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
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

  /**
   * Analyze each image individually to determine its color
   */
  async analyzeImageColors(imageUrls: string[]): Promise<ImageColorResult[]> {
    if (imageUrls.length === 0) {
      return [];
    }

    try {
      console.log(
        `   🎨 Analyzing colors for ${imageUrls.length} images individually...`
      );

      // Download all images as base64 first
      const imageData: Array<{ url: string; base64: string | null }> = [];

      for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i];
        console.log(`   📥 Downloading image ${i + 1}/${imageUrls.length}...`);

        const base64 = await this.downloadImageAsBase64(url);
        imageData.push({ url, base64 });

        // Small delay between downloads to avoid overwhelming the server
        if (i < imageUrls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

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

      const userMessage = {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze these ${successfulImages.length} images for color detection:`,
          },
          ...successfulImages.map(img => ({
            type: 'image_url',
            image_url: { url: img.base64! },
          })),
        ],
      };

      // Retry logic for image analysis
      const maxRetries = 2;
      let lastError: any = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(
            `   🔄 Color analysis attempt ${attempt}/${maxRetries}...`
          );

          // Create a timeout promise
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(
              () => reject(new Error('Request timeout after 90 seconds')),
              90000 // Increased timeout since we're using base64
            );
          });

          // Race between the API call and timeout
          const response = (await Promise.race([
            (await this.getOpenAI()).chat.completions.create({
              model: 'gpt-4o',
              messages: [
                { role: 'system', content: systemPrompt },
                userMessage,
              ],
              temperature: 0.2,
              response_format: { type: 'json_object' },
            }),
            timeoutPromise,
          ])) as any;

          const content = response.choices[0]?.message?.content;
          if (!content) {
            throw new Error('No content in OpenAI response');
          }

          const result = JSON.parse(content) as {
            images?: Array<{ color?: string | null }>;
          };

          // Map results back to original URLs in order
          const colorResults: ImageColorResult[] = imageUrls.map(url => {
            const successfulIndex = successfulImages.findIndex(
              img => img.url === url
            );
            if (successfulIndex === -1) {
              // This image failed to download
              return { url, color: null };
            }

            const imageResult = result.images?.[successfulIndex];
            return {
              url,
              color:
                imageResult?.color && imageResult.color.trim()
                  ? imageResult.color.trim()
                  : null,
            };
          });

          console.log(
            `   ✅ Color analysis completed for ${imageUrls.length} images`
          );
          return colorResults;
        } catch (error) {
          lastError = error;
          console.error(
            `   ❌ Color analysis attempt ${attempt} failed:`,
            error
          );

          if (attempt < maxRetries) {
            console.log(`   🔄 Retrying color analysis...`);
            await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds before retry
          }
        }
      }

      // If all attempts failed, throw the last error
      throw lastError;
    } catch (error) {
      console.error('Error analyzing image colors:', error);

      // Return null colors for all images if analysis fails
      return imageUrls.map(url => ({ url, color: null }));
    }
  }
}
