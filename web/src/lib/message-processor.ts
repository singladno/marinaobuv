import { prisma } from './db-node';

export async function saveWhatsAppMessage(
  data: Record<string, unknown>,
  text: string | null,
  mediaS3Key: string | null,
  mediaUrl: string | null,
  body: Record<string, unknown>
): Promise<string> {
  const key = data.key as Record<string, unknown>;

  const waMessage = await prisma.whatsAppMessage.upsert({
    where: { waMessageId: key.id as string },
    update: {
      from: (key.remoteJid as string) || null,
      fromMe: (key.fromMe as boolean) || false,
      text,
      mediaS3Key,
      mediaUrl,
      rawPayload: body as unknown as any,
    },
    create: {
      waMessageId: key.id as string,
      from: (key.remoteJid as string) || null,
      fromMe: (key.fromMe as boolean) || false,
      text,
      mediaS3Key,
      mediaUrl,
      rawPayload: body as unknown as any,
    },
  });

  return waMessage.id;
}
