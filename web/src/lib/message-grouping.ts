import { prisma } from './db-node';

/**
 * Group messages by provider and time proximity for product context
 */
export async function groupMessagesForProductContext(
  messageIds: string[]
): Promise<{ [key: string]: string[] }> {
  const messages = await prisma.whatsAppMessage.findMany({
    where: { id: { in: messageIds } },
    select: {
      id: true,
      from: true,
      fromName: true,
      text: true,
      timestamp: true,
      type: true,
      mediaUrl: true,
      mediaS3Key: true,
      createdAt: true,
      providerId: true,
    },
    orderBy: { createdAt: 'desc' }, // Start from latest messages
  });

  const groups: { [key: string]: string[] } = {};
  let currentGroup: string[] = [];
  let currentProviderId: string | null = null;
  let groupCounter = 0;

  for (const message of messages) {
    if (!message.from) continue;
    // Include messages with text OR images
    if (!message.text && message.type !== 'image') continue;

    // Use providerId if available, otherwise use from field for grouping
    const messageProviderId = message.providerId || message.from;

    // If this is the first message or from the same provider as current group
    if (currentProviderId === null || messageProviderId === currentProviderId) {
      currentGroup.push(message.id);
      currentProviderId = messageProviderId;
    } else {
      // Different provider - finalize current group and start new one
      if (currentGroup.length > 0) {
        const groupKey = `${currentProviderId}_${groupCounter}_${Date.now()}`;
        groups[groupKey] = [...currentGroup];
        groupCounter++;
      }

      // Start new group with current message
      currentGroup = [message.id];
      currentProviderId = messageProviderId;
    }
  }

  // Don't forget the last group
  if (currentGroup.length > 0 && currentProviderId) {
    const groupKey = `${currentProviderId}_${groupCounter}_${Date.now()}`;
    groups[groupKey] = [...currentGroup];
  }

  return groups;
}
