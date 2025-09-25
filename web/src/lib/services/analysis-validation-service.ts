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
   * Validate analysis result for required fields
   */
  validateAnalysisResult(result: AnalysisResult): boolean {
    if (!this.validateBasicFields(result)) {
      return false;
    }

    if (!this.validateSizes(result)) {
      return false;
    }

    console.log('✅ Validation passed: All required fields present');
    return true;
  }
}
