import { getCategoryTree } from '../catalog-categories';
import { env } from '../env';
import OpenAI from 'openai';

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
    // Initialize OpenAI lazily
    this.openai = null;
    this.validationService = new AnalysisValidationService();
    this.promptService = new AnalysisPromptService();
    this.colorService = new PerImageColorService();
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
   * Analyze text and images together using OpenAI Vision
   */
  async analyzeTextAndImages(
    textContent: string,
    imageUrls: string[],
    context: string
  ): Promise<AnalysisResult | null> {
    // Add timeout protection for the entire analysis
    const timeoutMs = 5 * 60 * 1000; // 5 minutes timeout
    return new Promise(async resolve => {
      const timeout = setTimeout(() => {
        console.log(
          `⏰ Analysis timed out after ${timeoutMs / 1000}s, skipping...`
        );
        resolve(null); // Return null instead of rejecting
      }, timeoutMs);

      try {
        const result = await this.performAnalysisWithRetry(
          textContent,
          imageUrls,
          context
        );
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        console.error('Analysis failed after retries:', error);
        resolve(null); // Skip this product/group
      }
    });
  }

  private async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isImageDownloadError(e: unknown): boolean {
    const err = e as any;
    const message: string = err?.message || '';
    const code: string | undefined = err?.code || err?.error?.code;
    return (
      message.includes('Timeout while downloading') ||
      message.includes('invalid_image_url') ||
      code === 'invalid_image_url'
    );
  }

  private async performAnalysisWithRetry(
    textContent: string,
    imageUrls: string[],
    context: string,
    maxAttempts: number = 3
  ): Promise<AnalysisResult | null> {
    let attempt = 0;
    let lastError: unknown = null;
    while (attempt < maxAttempts) {
      attempt += 1;
      try {
        console.log(`   🔁 OpenAI analysis attempt ${attempt}/${maxAttempts}`);
        return await this.performAnalysis(textContent, imageUrls, context);
      } catch (e) {
        lastError = e;
        const backoffMs = 1000 * Math.pow(2, attempt - 1);
        if (this.isImageDownloadError(e)) {
          console.warn(
            `   ⚠️  Image download error from OpenAI on attempt ${attempt}. Retrying in ${backoffMs}ms...`
          );
          await this.sleep(backoffMs);
          continue;
        }
        console.error('   ❌ Non-retryable error during analysis:', e);
        throw e;
      }
    }
    console.error(
      `   ❌ Failed to analyze after ${maxAttempts} attempts. Skipping product.`
    );
    if (lastError) console.error(lastError);
    return null;
  }

  private async performAnalysis(
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

      console.log(
        `   📸 Processing ${validImageUrls.length} valid image URLs for analysis`
      );

      for (const imageUrl of validImageUrls) {
        userMessage.content.push({
          type: 'image_url',
          image_url: { url: imageUrl },
        });
      }

      if (validImageUrls.length === 0 && imageUrls.length > 0) {
        console.log(
          `   ⚠️  No valid image URLs found, proceeding with text-only analysis`
        );
      }

      messages.push(userMessage);

      const openai = await this.getOpenAI();
      const response = await openai.chat.completions.create({
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
        console.log(
          `   🎨 Starting color analysis for ${imageUrls.length} images...`
        );
        imageColors = await this.colorService.analyzeImageColors(imageUrls);
        const successfulColors = imageColors.filter(ic => ic.color).length;
        console.log(
          `   🎨 Color analysis results: ${successfulColors}/${imageColors.length} images with colors`
        );

        if (successfulColors === 0) {
          console.log(
            `   ⚠️  No colors detected from images, continuing with text analysis only`
          );
        }
      } catch (colorError) {
        console.error('   ❌ Color analysis failed:', colorError);
        console.log(
          `   🔄 Continuing with text analysis only (no image colors)`
        );
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
      // Re-throw to be handled by retry logic
      throw error;
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
      const openai = await this.getOpenAI();
      const response = await openai.chat.completions.create({
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
