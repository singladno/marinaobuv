import {
  GROUPING_SYSTEM_PROMPT,
  GROUPING_USER_PROMPT,
} from './prompts/grouping-prompts';

/**
 * Create the GPT prompt for message grouping
 */
export function createGroupingPrompt(
  messagesForGPT: Array<{
    id: string;
    index: number;
    sender: string;
    type: string;
    text: string;
    hasImage: boolean;
    imageUrl: string | null;
    timestamp: string;
    timeAgo: string;
  }>
): string {
  return `${GROUPING_SYSTEM_PROMPT}

MESSAGES:
${JSON.stringify(messagesForGPT, null, 1)}

${GROUPING_USER_PROMPT(JSON.stringify(messagesForGPT, null, 1))}`;
}
