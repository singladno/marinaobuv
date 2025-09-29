import { MessageGrouper } from './grouping/MessageGrouper';

export interface MessageGroup {
  groupId: string;
  messageIds: string[];
  productContext: string;
  confidence: number;
}

/**
 * Group messages using GPT analysis
 */
export async function groupMessagesWithGPT(
  messageIds: string[]
): Promise<MessageGroup[]> {
  const grouper = new MessageGrouper();
  return await grouper.groupMessagesWithGPT(messageIds);
}
