import { MessageGroupingService } from './services/message-grouping-service';

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
  const grouper = new MessageGroupingService();
  return await grouper.groupMessages(messageIds);
}
