/**
 * Service for analyzing individual images to detect colors
 */
import { env } from '../env';

export interface ImageColorResult {
  url: string;
  color: string | null;
}

export class PerImageColorService {
  private openai: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  constructor() {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required');
    }

    this.openai = require('openai')({ apiKey: env.OPENAI_API_KEY }); // eslint-disable-line @typescript-eslint/no-require-imports
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

      const systemPrompt = `You are an image color detection assistant for a shoe catalog.
Given a list of image URLs, your ONLY task is: for EACH image URL, return the color of the shoe shown in that image.

Rules:
- Use short Russian color names: "черный", "белый", "бежевый", "синий", "красный", "коричневый", "серый", "зелёный", "розовый", "фиолетовый", "бордовый".
- If the color is unclear, return null for that image's color.
- Maintain the exact input order of image URLs.
- Return STRICT JSON with this shape:
  { "images": [ { "url": "...", "color": "черный" | null }, ... ] }
- Do NOT include explanations or any extra fields.`;

      const userMessage = {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze these ${imageUrls.length} images for color detection:`,
          },
          ...imageUrls.map(url => ({
            type: 'image_url',
            image_url: { url },
          })),
        ],
      };

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: systemPrompt }, userMessage],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      const result = JSON.parse(content) as {
        images?: Array<{ url?: string; color?: string | null }>;
      };

      // Map results back to original URLs in order
      const colorResults: ImageColorResult[] = imageUrls.map((url, index) => {
        const imageResult = result.images?.[index];
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
      console.error('Error analyzing image colors:', error);

      // Return null colors for all images if analysis fails
      return imageUrls.map(url => ({ url, color: null }));
    }
  }
}
