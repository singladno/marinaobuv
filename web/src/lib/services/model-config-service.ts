/**
 * Centralized model configuration service for cost optimization
 */
export class ModelConfigService {
  /**
   * Get the appropriate model for different tasks
   */
  static getModelForTask(
    task: 'analysis' | 'grouping' | 'color' | 'vision'
  ): string {
    const env = process.env;

    // Allow override via environment variables
    if (env.OPENAI_ANALYSIS_MODEL) return env.OPENAI_ANALYSIS_MODEL;
    if (env.OPENAI_GROUPING_MODEL) return env.OPENAI_GROUPING_MODEL;
    if (env.OPENAI_COLOR_MODEL) return env.OPENAI_COLOR_MODEL;
    if (env.OPENAI_VISION_MODEL) return env.OPENAI_VISION_MODEL;

    // Default optimized models (using available GPT-4o series)
    switch (task) {
      case 'analysis':
        return 'gpt-4o-mini'; // Good quality for complex product analysis
      case 'grouping':
        return 'gpt-4o-mini'; // Good performance for message grouping
      case 'color':
        return 'gpt-4o-mini'; // Good for color detection
      case 'vision':
        return 'gpt-4o-mini'; // Good vision capabilities
      default:
        return 'gpt-4o-mini';
    }
  }

  /**
   * Get temperature setting for different tasks
   */
  static getTemperatureForTask(
    task: 'analysis' | 'grouping' | 'color' | 'vision'
  ): number {
    switch (task) {
      case 'analysis':
        return 0.1; // Low temperature for consistent product analysis
      case 'grouping':
        return 0.1; // Low temperature for consistent grouping
      case 'color':
        return 0.2; // Slightly higher for color creativity
      case 'vision':
        return 0.1; // Low temperature for consistent vision analysis
      default:
        return 0.1;
    }
  }

  /**
   * Get max tokens for different tasks (cost optimization)
   */
  static getMaxTokensForTask(
    task: 'analysis' | 'grouping' | 'color' | 'vision'
  ): number {
    switch (task) {
      case 'analysis':
        return 2000; // Sufficient for product analysis
      case 'grouping':
        return 4000; // Increased for large grouping responses
      case 'color':
        return 500; // Minimal for color detection
      case 'vision':
        return 2000; // Sufficient for vision analysis
      default:
        return 1000;
    }
  }
}
