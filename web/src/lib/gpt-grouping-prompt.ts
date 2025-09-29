import {
  GROUPING_RULES,
  GROUPING_RESPONSE_FORMAT,
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
  return `Group WhatsApp messages by product. Analyze message patterns and timestamps to create accurate product groups.

MESSAGES:
${JSON.stringify(messagesForGPT, null, 1)}

${GROUPING_RULES}

${GROUPING_RESPONSE_FORMAT}`;
}
