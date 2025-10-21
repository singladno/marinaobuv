import type { AnalysisResult } from '@/lib/types/analysis-result';

import { ImageData } from './image-processing-service';
import { ProductCreationCore } from './product-creation-core';
import {
  mapSeason,
  mapGender,
  generateArticleNumber,
  createSlug,
} from './product-creation-mappers';

interface CreateDraftProductFromAnalysisParams {
  messageId: string;
  from: string;
  fromName: string;
  analysis: AnalysisResult;
  images: ImageData[];
  context: string;
  sourceMessageIds?: string[];
}

/**
 * Service for creating draft products from analysis results
 */
export class ProductCreationService {
  private core: ProductCreationCore;

  constructor() {
    this.core = new ProductCreationCore();
  }

  /**
   * Create a draft product from analysis results
   */
  async createDraftProductFromAnalysis({
    messageId,
    from,
    fromName,
    analysis,
    images,
    context,
    sourceMessageIds = [],
  }: CreateDraftProductFromAnalysisParams) {
    return await this.core.createDraftProductFromAnalysis({
      messageId,
      from,
      fromName,
      analysis,
      images,
      context,
      sourceMessageIds,
    });
  }

  /**
   * Create a final product directly from analysis results
   */
  async createFinalProductFromAnalysis({
    messageId,
    from,
    fromName,
    analysis,
    images,
    context,
    sourceMessageIds = [],
  }: CreateDraftProductFromAnalysisParams) {
    return await this.core.createFinalProductFromAnalysis({
      messageId,
      from,
      fromName,
      analysis,
      images,
      context,
      sourceMessageIds,
    });
  }

  /**
   * Update an existing draft product with new analysis results
   */
  async updateDraftProductFromAnalysis(
    draftProductId: string,
    analysis: AnalysisResult,
    images: ImageData[]
  ) {
    return await this.core.updateDraftProductFromAnalysis(
      draftProductId,
      analysis,
      images
    );
  }

  /**
   * Map AI season response to valid Prisma enum values
   */
  mapSeason(aiSeason: string): 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER' {
    return mapSeason(aiSeason);
  }

  /**
   * Map AI gender response to valid Prisma enum values
   */
  mapGender(aiGender: string | undefined | null): 'MALE' | 'FEMALE' {
    return mapGender(aiGender || 'MALE');
  }

  /**
   * Generate a unique article number for a product
   */
  generateArticleNumber(): string {
    return generateArticleNumber();
  }

  /**
   * Create a slug from a product name
   */
  createSlug(name: string): string {
    return createSlug(name);
  }
}
