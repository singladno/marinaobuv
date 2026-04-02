import type { AnalysisResult } from '@/lib/types/analysis-result';
import { logger } from '@/lib/server/logger';

/**
 * Service for validating analysis results
 */
export class AnalysisValidationService {
  /**
   * Validate basic required fields
   */
  private validateBasicFields(result: AnalysisResult): boolean {
    // Allow null/empty names since they will be provided by image analysis
    if (
      result.name !== null &&
      result.name !== undefined &&
      result.name.trim() === ''
    ) {
      logger.debug(
        '❌ Validation failed: Empty product name (should be null if not provided)'
      );
      return false;
    }

    // Allow missing description in first request (text analysis)
    // Description will be provided by image analysis
    if (
      result.description !== undefined &&
      result.description !== null &&
      result.description.trim() === ''
    ) {
      logger.debug(
        '❌ Validation failed: Empty product description (should be null if not provided)'
      );
      return false;
    }

    // Check if price is missing - this should skip the group, not fail validation
    if (result.price === undefined || result.price === null) {
      logger.debug('⚠️ Skipping group: No price returned from LLM analysis');
      return false;
    }

    if (result.price < 0) {
      logger.debug('❌ Validation failed: Negative price not allowed');
      return false;
    }

    // Allow price 0 for now, but log a warning
    if (result.price === 0) {
      logger.debug('⚠️ Warning: Price is 0, this might need manual review');
    }

    return true;
  }

  /**
   * Validate sizes structure
   */
  private validateSizes(result: AnalysisResult): boolean {
    if (!result.sizes || result.sizes.length === 0) {
      logger.debug('❌ Validation failed: Missing sizes');
      return false;
    }

    for (const size of result.sizes) {
      if (!size.size || !size.count || size.count <= 0) {
        logger.debug('❌ Validation failed: Invalid size structure');
        return false;
      }
    }

    return true;
  }

  /**
   * Validate category fields
   */
  private validateCategoryFields(result: AnalysisResult): boolean {
    // If categoryId is provided, it should be a valid string
    if (result.categoryId && typeof result.categoryId !== 'string') {
      logger.debug('❌ Validation failed: categoryId must be a string');
      return false;
    }

    // If newCategory is provided, it should have required fields
    if (result.newCategory) {
      if (
        !result.newCategory.name ||
        typeof result.newCategory.name !== 'string'
      ) {
        logger.debug('❌ Validation failed: newCategory.name is required');
        return false;
      }
      if (
        !result.newCategory.slug ||
        typeof result.newCategory.slug !== 'string'
      ) {
        logger.debug('❌ Validation failed: newCategory.slug is required');
        return false;
      }
      if (
        result.newCategory.parentCategoryId &&
        typeof result.newCategory.parentCategoryId !== 'string'
      ) {
        logger.debug(
          '❌ Validation failed: newCategory.parentCategoryId must be a string'
        );
        return false;
      }
    }

    return true;
  }

  /**
   * Validate analysis result for required fields
   */
  validateAnalysisResult(result: AnalysisResult): boolean {
    if (!this.validateBasicFields(result)) {
      return false;
    }

    if (!this.validateSizes(result)) {
      return false;
    }

    if (!this.validateCategoryFields(result)) {
      return false;
    }

    logger.debug('✅ Validation passed: All required fields present');
    return true;
  }
}
