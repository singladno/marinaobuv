import { getCategoryTree } from '../catalog-categories';
import { env } from '../env';

import { AnalysisPromptService } from './analysis-prompt-service';
import { AnalysisValidationService } from './analysis-validation-service';
import { PerImageColorService } from './per-image-color-service';

export interface AnalysisResult {
  name: string;
  price: number;
  currency: string;
  gender: 'MALE' | 'FEMALE' | 'UNISEX';
  season: 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER';
  sizes: Array<{ size: string; count: number }>;
  colors: string[];
  imageColors: Array<{ url: string; color: string | null }>;
  description?: string;
  material?: string;
  categoryId?: string | null;
  newCategory?: {
    name: string;
    slug: string;
    parentCategoryId: string;
  };
  packPairs?: number;
  providerDiscount?: number;
}

/**
 * Service for unified text and image analysis using OpenAI
 */
export class UnifiedAnalysisService {
  private openai: any;
  private validationService: AnalysisValidationService;
  private promptService: AnalysisPromptService;
  private colorService: PerImageColorService;

  constructor() {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required');
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    this.openai = require('openai')({ apiKey: env.OPENAI_API_KEY });
    this.validationService = new AnalysisValidationService();
    this.promptService = new AnalysisPromptService();
    this.colorService = new PerImageColorService();
  }

  /**
   * Analyze text and images together using OpenAI Vision
   */
  async analyzeTextAndImages(
    textContent: string,
    imageUrls: string[],
    context: string
  ): Promise<AnalysisResult | null> {
    try {
      // Get category tree for category selection
      const categoryTree = await getCategoryTree();
      const categoryTreeJson = JSON.stringify(categoryTree, null, 2);

      const messages: Array<{
        role: string;
        content:
          | string
          | Array<{ type: string; text?: string; image_url?: { url: string } }>;
      }> = [
        {
          role: 'system',
          content: this.promptService.getSystemPrompt(),
        },
      ];

      const userMessage: {
        role: string;
        content: Array<{
          type: string;
          text?: string;
          image_url?: { url: string };
        }>;
      } = {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Context: ${context}\n\nText content: ${textContent}\n\nДОСТУПНЫЕ КАТЕГОРИИ:\n${categoryTreeJson}`,
          },
        ],
      };

      // Add images to the message (only if we have valid URLs)
      const validImageUrls = imageUrls.filter(
        url => url && url.startsWith('http')
      );
      for (const imageUrl of validImageUrls) {
        userMessage.content.push({
          type: 'image_url',
          image_url: { url: imageUrl },
        });
      }

      messages.push(userMessage);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      const result = JSON.parse(content);

      // Analyze each image individually for color detection
      let imageColors: Array<{ url: string; color: string | null }> = [];
      try {
        imageColors = await this.colorService.analyzeImageColors(imageUrls);
        console.log(
          `   🎨 Color analysis results: ${imageColors.filter(ic => ic.color).length}/${imageColors.length} images with colors`
        );
      } catch (colorError) {
        console.error('   ❌ Color analysis failed:', colorError);
        // Fallback: create empty color results
        imageColors = imageUrls.map(url => ({ url, color: null }));
      }

      // Add per-image colors to the result
      result.imageColors = imageColors;

      // Validate the result
      if (!this.validationService.validateAnalysisResult(result)) {
        console.log(
          '❌ Analysis result validation failed, not saving draft product'
        );
        return null;
      }

      return result as AnalysisResult;
    } catch (error) {
      console.error('Error analyzing text and images:', error);

      // If images fail, try text-only analysis
      if (imageUrls.length > 0 && textContent.trim()) {
        console.log('   🔄 Falling back to text-only analysis...');
        return await this.analyzeTextOnly(textContent, context);
      }

      return null;
    }
  }

  /**
   * Analyze text only when images fail
   */
  private async analyzeTextOnly(
    textContent: string,
    context: string
  ): Promise<AnalysisResult | null> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: this.promptService.getTextOnlySystemPrompt(),
          },
          {
            role: 'user',
            content: `Context: ${context}\n\nText content: ${textContent}`,
          },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      const result = JSON.parse(content);

      // Validate the result
      if (!this.validationService.validateAnalysisResult(result)) {
        console.log(
          '❌ Text-only analysis validation failed, not saving draft product'
        );
        return null;
      }

      return result as AnalysisResult;
    } catch (error) {
      console.error('Error in text-only analysis:', error);
      return null;
    }
  }
}
