import type { AnalysisResult } from './unified-analysis-service';

/**
 * Service for validating analysis results
 */
export class AnalysisValidationService {
  /**
   * Validate basic required fields
   */
  private validateBasicFields(result: AnalysisResult): boolean {
    if (!result.name || result.name.trim() === '') {
      console.log('❌ Validation failed: Missing product name');
      return false;
    }

    if (!result.description || result.description.trim() === '') {
      console.log('❌ Validation failed: Missing product description');
      return false;
    }

    if (!result.price || result.price <= 0) {
      console.log('❌ Validation failed: Missing or invalid price');
      return false;
    }

    return true;
  }

  /**
   * Validate sizes structure
   */
  private validateSizes(result: AnalysisResult): boolean {
    if (!result.sizes || result.sizes.length === 0) {
      console.log('❌ Validation failed: Missing sizes');
      return false;
    }

    for (const size of result.sizes) {
      if (!size.size || !size.count || size.count <= 0) {
        console.log('❌ Validation failed: Invalid size structure');
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
      console.log('❌ Validation failed: categoryId must be a string');
      return false;
    }

    // If newCategory is provided, it should have required fields
    if (result.newCategory) {
      if (
        !result.newCategory.name ||
        typeof result.newCategory.name !== 'string'
      ) {
        console.log('❌ Validation failed: newCategory.name is required');
        return false;
      }
      if (
        !result.newCategory.slug ||
        typeof result.newCategory.slug !== 'string'
      ) {
        console.log('❌ Validation failed: newCategory.slug is required');
        return false;
      }
      if (
        result.newCategory.parentCategoryId &&
        typeof result.newCategory.parentCategoryId !== 'string'
      ) {
        console.log(
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

    console.log('✅ Validation passed: All required fields present');
    return true;
  }
}
