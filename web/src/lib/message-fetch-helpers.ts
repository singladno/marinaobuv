import { prisma } from '../lib/db-node';

export async function getExistingMessageIds(
  messageIds: string[]
): Promise<Set<string>> {
  const existingMessages = await prisma.whatsAppMessage.findMany({
    where: {
      waMessageId: {
        in: messageIds,
      },
    },
    select: {
      waMessageId: true,
    },
  });

  return new Set(existingMessages.map(m => m.waMessageId));
}

export async function getRecentKnownIds(limit = 1000): Promise<Set<string>> {
  const rows = await prisma.whatsAppMessage.findMany({
    select: { waMessageId: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return new Set(rows.map(r => r.waMessageId));
}
