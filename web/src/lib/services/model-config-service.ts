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

    // Task-specific overrides via environment variables
    switch (task) {
      case 'analysis':
        if (env.OPENAI_ANALYSIS_MODEL) return env.OPENAI_ANALYSIS_MODEL;
        return 'gpt-5-mini'; // Better quality for complex product analysis
      case 'grouping':
        if (env.OPENAI_GROUPING_MODEL) return env.OPENAI_GROUPING_MODEL;
        return 'gpt-5-nano'; // 77% cheaper than gpt-3.5-turbo, better performance
      case 'color':
        if (env.OPENAI_COLOR_MODEL) return env.OPENAI_COLOR_MODEL;
        return 'gpt-5-nano'; // 40% cheaper than gpt-4o-mini, sufficient for color detection
      case 'vision':
        if (env.OPENAI_VISION_MODEL) return env.OPENAI_VISION_MODEL;
        return 'gpt-5-mini'; // Better vision capabilities than gpt-4o-mini
      default:
        return 'gpt-5-mini';
    }
  }

  /**
   * Whether the given model supports Responses API reasoning/text controls
   */
  static supportsReasoning(model: string): boolean {
    // Current GPT-5 family supports reasoning params; older 4o models do not
    return model.startsWith('gpt-5');
  }

  static supportsTextControls(model: string): boolean {
    return model.startsWith('gpt-5');
  }

  /**
   * Get reasoning effort for GPT-5 models
   */
  static getReasoningEffortForTask(
    task: 'analysis' | 'grouping' | 'color' | 'vision'
  ): 'minimal' | 'low' | 'medium' | 'high' {
    switch (task) {
      case 'analysis':
        return 'high'; // High reasoning for complex product analysis
      case 'grouping':
        return 'low'; // Low reasoning for fast message grouping
      case 'color':
        return 'minimal'; // Minimal reasoning for simple color detection
      case 'vision':
        return 'medium'; // Medium reasoning for vision analysis
      default:
        return 'medium';
    }
  }

  /**
   * Get text verbosity for GPT-5 models
   */
  static getTextVerbosityForTask(
    task: 'analysis' | 'grouping' | 'color' | 'vision'
  ): 'low' | 'medium' | 'high' {
    switch (task) {
      case 'analysis':
        return 'high'; // High verbosity for detailed product analysis
      case 'grouping':
        return 'low'; // Low verbosity for concise grouping responses
      case 'color':
        return 'low'; // Low verbosity for simple color detection
      case 'vision':
        return 'medium'; // Medium verbosity for vision analysis
      default:
        return 'medium';
    }
  }

  /**
   * Get max output tokens for different tasks
   */
  static getMaxOutputTokensForTask(
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
