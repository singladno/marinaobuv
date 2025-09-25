import { prisma } from './db-node';
import { callGPTForGrouping } from './gpt-grouping-api';
import { fallbackToSimpleGrouping } from './gpt-grouping-fallback';
import { createGroupingPrompt } from './gpt-grouping-prompt';

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
  console.log(
    `Analyzing ${messageIds.length} messages with GPT for intelligent grouping...`
  );

  // Process messages in batches to avoid OpenAI rate limits (configurable via env)
  const batchSize = 150; // Reduced to avoid token limits
  const allGroups: MessageGroup[] = [];
  let groupCounter = 0;

  for (let i = 0; i < messageIds.length; i += batchSize) {
    const batchMessageIds = messageIds.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(messageIds.length / batchSize);

    console.log(
      `\n🔄 Processing batch ${batchNumber}/${totalBatches}: ${batchMessageIds.length} messages`
    );
    console.log(
      `   Messages ${i + 1}-${Math.min(i + batchSize, messageIds.length)} of ${messageIds.length}`
    );

    const batchGroups = await processBatch(batchMessageIds, groupCounter);
    allGroups.push(...batchGroups);
    groupCounter += batchGroups.length;

    console.log(
      `✅ Batch ${batchNumber} complete: ${batchGroups.length} groups created`
    );
    console.log(`   Total groups so far: ${allGroups.length}`);

    // Add a small delay between batches to avoid rate limiting
    if (i + batchSize < messageIds.length) {
      console.log(`⏳ Waiting 1 second before next batch...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(
    `GPT analysis complete. Created ${allGroups.length} groups from ${messageIds.length} messages`
  );
  return allGroups;
}

async function processBatch(
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
    timeAgo: getTimeAgo(msg.createdAt, messages[0].createdAt), // Relative time from first message
  }));

  // Helper function to calculate relative time
  function getTimeAgo(messageTime: Date, firstMessageTime: Date): string {
    const diffMs = messageTime.getTime() - firstMessageTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `+${diffDays}d`;
    if (diffHours > 0) return `+${diffHours}h`;
    if (diffMinutes > 0) return `+${diffMinutes}m`;
    return '0m';
  }

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
