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
      remoteJid: key.remoteJid as string,
      fromMe: key.fromMe as boolean,
      pushName: data.pushName as string | null,
      messageType: data.messageType as string | null,
      text,
      mediaS3Key,
      mediaUrl,
      rawPayload: body as any,
    },
    create: {
      waMessageId: key.id as string,
      remoteJid: key.remoteJid as string,
      fromMe: key.fromMe as boolean,
      pushName: data.pushName as string | null,
      messageType: data.messageType as string | null,
      text,
      mediaS3Key,
      mediaUrl,
      rawPayload: body as any,
    },
  });

  return waMessage.id;
}
