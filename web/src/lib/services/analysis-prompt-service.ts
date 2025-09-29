import {
  SYSTEM_PROMPT,
  TEXT_ONLY_SYSTEM_PROMPT,
} from '../prompts/analysis-prompts';

/**
 * Service for generating analysis prompts
 */
export class AnalysisPromptService {
  /**
   * Get system prompt for text and image analysis
   */
  getSystemPrompt(): string {
    return SYSTEM_PROMPT;
  }

  /**
   * Get system prompt for text-only analysis
   */
  getTextOnlySystemPrompt(): string {
    return TEXT_ONLY_SYSTEM_PROMPT;
  }
}
