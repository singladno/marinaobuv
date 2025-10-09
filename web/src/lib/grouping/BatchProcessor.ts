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
    console.log(
      `   📥 Processing batch of ${batchMessageIds.length} message IDs`
    );

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

    console.log(`   📊 Retrieved ${messages.length} messages from database`);

    if (messages.length === 0) {
      console.log(`   ⚠️  No messages found for batch IDs`);
      return [];
    }

    // Log message details
    const textMessages = messages.filter(
      m => m.text && m.text.trim().length > 0
    );
    const imageMessages = messages.filter(
      m => m.type === 'image' && m.mediaUrl
    );
    const otherMessages = messages.filter(m => !m.text && m.type !== 'image');

    console.log(`   📝 Text messages: ${textMessages.length}`);
    console.log(`   🖼️  Image messages: ${imageMessages.length}`);
    console.log(`   📄 Other messages: ${otherMessages.length}`);

    // Show sample messages
    console.log(`   📋 Sample messages:`);
    messages.slice(0, 3).forEach((msg, i) => {
      const preview = msg.text
        ? msg.text.substring(0, 50) + '...'
        : `[${msg.type}]`;
      console.log(`     ${i + 1}. ${msg.fromName || msg.from}: ${preview}`);
    });

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

    console.log(
      `   🔄 Prepared ${messagesForGPT.length} messages for GPT analysis`
    );
    console.log(
      `   📊 Message types: ${[...new Set(messagesForGPT.map(m => m.type))].join(', ')}`
    );
    console.log(
      `   👥 Senders: ${[...new Set(messagesForGPT.map(m => m.sender))].join(', ')}`
    );

    // Create prompt for GPT
    const gptPrompt = createGroupingPrompt(messagesForGPT);
    console.log(`   📝 Created GPT prompt (${gptPrompt.length} characters)`);

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
