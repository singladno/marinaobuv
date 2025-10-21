import { prisma } from '../db-node';

export interface ExtendedBatchResult {
  messageIds: string[];
  totalCount: number;
  extendedCount: number;
  originalBatchSize: number;
  nextOffset?: number; // Add next offset for non-overlapping batches
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
  // IMPORTANT: Only include messages that are NOT already processed
  const consecutiveMessages = await prisma.whatsAppMessage.findMany({
    where: {
      processed: false, // CRITICAL: Only unprocessed messages
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
      processed: true, // Include processed flag to double-check
    },
    orderBy: { createdAt: 'asc' },
  });

  // Double-check: Filter out any messages that might have been processed between queries
  const unprocessedConsecutiveMessages = consecutiveMessages.filter(
    msg => !msg.processed
  );

  // Filter consecutive messages (within reasonable time gap)
  const timeGapSeconds = 300; // 5 minutes - if gap is larger, consider it a new sequence
  const consecutiveFromSameSender: typeof unprocessedConsecutiveMessages = [];

  for (let i = 0; i < unprocessedConsecutiveMessages.length; i++) {
    const currentMessage = unprocessedConsecutiveMessages[i];
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
 * Uses offset-based fetching to prevent overlapping batches
 * Only processes messages from the last N hours (configurable via MESSAGE_PROCESSING_HOURS)
 */
export async function fetchExtendedBatch(
  batchSize: number,
  targetGroupId?: string,
  offset: number = 0,
  hoursBack: number = 24
): Promise<ExtendedBatchResult> {
  // Calculate the cutoff time for messages (N hours back from now)
  const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  // Get total count of unprocessed messages for offset calculation
  const totalUnprocessed = await prisma.whatsAppMessage.count({
    where: {
      processed: false,
      type: { in: ['textMessage', 'imageMessage', 'extendedTextMessage'] },
      ...(targetGroupId && { chatId: targetGroupId }),
      createdAt: {
        gte: cutoffTime, // Only messages from the last N hours
      },
    },
  });

  if (totalUnprocessed === 0 || offset >= totalUnprocessed) {
    return {
      messageIds: [],
      totalCount: 0,
      extendedCount: 0,
      originalBatchSize: batchSize,
      nextOffset: offset,
    };
  }

  // Fetch messages with offset to prevent overlap
  const initialMessages = await prisma.whatsAppMessage.findMany({
    where: {
      processed: false,
      type: { in: ['textMessage', 'imageMessage', 'extendedTextMessage'] },
      ...(targetGroupId && { chatId: targetGroupId }),
      createdAt: {
        gte: cutoffTime, // Only messages from the last N hours
      },
    },
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: batchSize,
  });

  if (initialMessages.length === 0) {
    return {
      messageIds: [],
      totalCount: 0,
      extendedCount: 0,
      originalBatchSize: batchSize,
      nextOffset: offset,
    };
  }

  const initialMessageIds = initialMessages.map(m => m.id);

  // For offset-based batching, we can skip the complex consecutive message extension
  // since we're processing in order and won't have overlaps
  const nextOffset = offset + initialMessages.length;

  return {
    messageIds: initialMessageIds,
    totalCount: initialMessages.length,
    extendedCount: 0,
    originalBatchSize: batchSize,
    nextOffset,
  };
}
