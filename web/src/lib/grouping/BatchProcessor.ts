import { prisma } from '../db-node';
import type { MessageGroup } from '../gpt-grouping';
import { callGPTForGrouping } from '../gpt-grouping-api';
import { fallbackToSimpleGrouping } from '../gpt-grouping-fallback';
import { createGroupingPrompt } from '../gpt-grouping-prompt';

export class BatchProcessor {
  /**
   * Process a batch of messages
   */
  async processBatch(
    batchMessageIds: string[],
    startGroupCounter: number
  ): Promise<MessageGroup[]> {
    // Get all messages with their content
    const messages = await prisma.whatsAppMessage.findMany({
      where: { id: { in: batchMessageIds } },
      select: {
        id: true,
        from: true,
        fromName: true,
        text: true,
        type: true,
        mediaUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (messages.length === 0) {
      return [];
    }

    // Prepare messages for GPT analysis (limit text length to avoid token limits)
    const messagesForGPT = messages.map((msg, index) => ({
      id: msg.id,
      index: index + 1,
      sender: msg.fromName || msg.from || 'unknown',
      type: msg.type || 'unknown',
      text: (msg.text || '').substring(0, 500), // Limit text to 500 chars
      hasImage: msg.type === 'image' && !!msg.mediaUrl,
      imageUrl: msg.type === 'image' ? msg.mediaUrl : null,
      timestamp: msg.createdAt.toISOString(),
      timeAgo: this.getTimeAgo(msg.createdAt, messages[0].createdAt), // Relative time from first message
    }));

    // Create prompt for GPT
    const gptPrompt = createGroupingPrompt(messagesForGPT);

    try {
      const parsed = await callGPTForGrouping(gptPrompt);

      // Trust GPT's analysis completely - no manual splitting or validation
      const groups = parsed.groups.map(
        (
          group: {
            messageIds: string[];
            productContext: string;
            confidence: number;
          },
          index: number
        ) => ({
          groupId: `gpt_${startGroupCounter + index}_${Date.now()}`,
          messageIds: group.messageIds,
          productContext: group.productContext,
          confidence: group.confidence,
        })
      );

      console.log(`   📊 Groups created:`);
      groups.forEach((group: MessageGroup, index: number) => {
        console.log(
          `     ${index + 1}. ${group.groupId}: ${group.messageIds.length} messages (confidence: ${group.confidence})`
        );
      });

      return groups;
    } catch (error) {
      console.error(
        'GPT grouping failed for batch, falling back to simple grouping:',
        error
      );
      console.error('Messages being grouped:', messagesForGPT.length);

      // Fallback to simple grouping by sender for this batch
      return fallbackToSimpleGrouping(messages, startGroupCounter);
    }
  }

  /**
   * Helper function to calculate relative time
   */
  private getTimeAgo(messageTime: Date, firstMessageTime: Date): string {
    const diffMs = messageTime.getTime() - firstMessageTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `+${diffDays}d`;
    if (diffHours > 0) return `+${diffHours}h`;
    if (diffMinutes > 0) return `+${diffMinutes}m`;
    return '0m';
  }
}
