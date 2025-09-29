import { prisma } from '../db-node';
import type { MessageGroup } from '../services/message-grouping-service';

export class MessageProcessor {
  /**
   * Fetch messages for a group
   */
  async fetchGroupMessages(messageIds: string[]) {
    console.log(
      `   📥 Fetching ${messageIds.length} messages from database...`
    );

    return await prisma.whatsAppMessage.findMany({
      where: { id: { in: messageIds } },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Check if group is already processed
   */
  async isGroupAlreadyProcessed(messageIds: string[]): Promise<boolean> {
    const existingDrafts = await prisma.waDraftProduct.findMany({
      where: { messageId: { in: messageIds } },
    });
    return existingDrafts.length > 0;
  }

  /**
   * Extract text content from messages
   */
  extractTextContent(messages: any[]): string[] {
    return messages
      .filter(msg => msg.text && msg.text.trim())
      .map(msg => msg.text!.trim());
  }
}
