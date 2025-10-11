import { prisma } from '../db-node';

export interface ExtendedBatchResult {
  messageIds: string[];
  totalCount: number;
  extendedCount: number;
  originalBatchSize: number;
}

/**
 * Extends a batch of messages to include consecutive messages from the same user
 * This ensures we don't split message sequences across batches
 */
export async function extendBatchWithConsecutiveMessages(
  originalMessageIds: string[],
  batchSize: number
): Promise<ExtendedBatchResult> {
  if (originalMessageIds.length === 0) {
    return {
      messageIds: [],
      totalCount: 0,
      extendedCount: 0,
      originalBatchSize: batchSize,
    };
  }

  // Get the messages with their sender and timestamp info
  const messages = await prisma.whatsAppMessage.findMany({
    where: {
      id: { in: originalMessageIds },
    },
    select: {
      id: true,
      from: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  if (messages.length === 0) {
    return {
      messageIds: [],
      totalCount: 0,
      extendedCount: 0,
      originalBatchSize: batchSize,
    };
  }

  // Find the last message in our batch
  const lastMessage = messages[messages.length - 1];
  const lastMessageTime = lastMessage.createdAt;
  const lastMessageSender = lastMessage.from;

  // Look for consecutive messages from the same sender after our batch
  const consecutiveMessages = await prisma.whatsAppMessage.findMany({
    where: {
      processed: false,
      type: { in: ['textMessage', 'imageMessage', 'extendedTextMessage'] },
      from: lastMessageSender,
      createdAt: {
        gt: lastMessageTime, // Messages after our batch
      },
    },
    select: {
      id: true,
      from: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Filter consecutive messages (within reasonable time gap)
  const timeGapSeconds = 300; // 5 minutes - if gap is larger, consider it a new sequence
  const consecutiveFromSameSender: typeof consecutiveMessages = [];

  for (let i = 0; i < consecutiveMessages.length; i++) {
    const currentMessage = consecutiveMessages[i];
    const prevMessage =
      i === 0 ? lastMessage : consecutiveFromSameSender[i - 1];

    const timeDiff =
      (currentMessage.createdAt.getTime() - prevMessage.createdAt.getTime()) /
      1000;

    // If time gap is too large, stop extending
    if (timeDiff > timeGapSeconds) {
      break;
    }

    consecutiveFromSameSender.push(currentMessage);
  }

  // Combine original batch with consecutive messages
  const extendedMessageIds = [
    ...originalMessageIds,
    ...consecutiveFromSameSender.map(m => m.id),
  ];

  const extendedCount = consecutiveFromSameSender.length;

  console.log(
    `📈 Extended batch: ${originalMessageIds.length} → ${extendedMessageIds.length} messages ` +
      `(+${extendedCount} consecutive from ${lastMessageSender})`
  );

  return {
    messageIds: extendedMessageIds,
    totalCount: extendedMessageIds.length,
    extendedCount,
    originalBatchSize: batchSize,
  };
}

/**
 * Fetches unprocessed messages and extends the batch if there are consecutive messages from the same user
 */
export async function fetchExtendedBatch(
  batchSize: number,
  targetGroupId?: string
): Promise<ExtendedBatchResult> {
  // First, get the initial batch
  const initialMessages = await prisma.whatsAppMessage.findMany({
    where: {
      processed: false,
      type: { in: ['textMessage', 'imageMessage', 'extendedTextMessage'] },
      ...(targetGroupId && { chatId: targetGroupId }),
    },
    orderBy: { createdAt: 'desc' },
    take: batchSize,
  });

  if (initialMessages.length === 0) {
    return {
      messageIds: [],
      totalCount: 0,
      extendedCount: 0,
      originalBatchSize: batchSize,
    };
  }

  const initialMessageIds = initialMessages.map(m => m.id);

  // Extend the batch with consecutive messages
  return await extendBatchWithConsecutiveMessages(initialMessageIds, batchSize);
}
