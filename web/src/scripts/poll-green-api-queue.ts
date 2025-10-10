#!/usr/bin/env tsx

// Load env first
import '../scripts/load-env';
import { prisma } from '../lib/db-node';
import { env } from '../lib/env';

type IncomingWebhook = {
  receiptId: number;
  body: any;
};

async function receiveOnce(baseUrl: string): Promise<IncomingWebhook | null> {
  const url = `${baseUrl}/ReceiveNotification/${env.GREEN_API_TOKEN}`;
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data || !data.receiptId) return null;
  return data as IncomingWebhook;
}

async function deleteReceipt(
  baseUrl: string,
  receiptId: number
): Promise<void> {
  const url = `${baseUrl}/DeleteNotification/${env.GREEN_API_TOKEN}/${receiptId}`;
  await fetch(url, { method: 'DELETE' }).catch(() => {});
}

async function saveMessageFromWebhook(webhook: IncomingWebhook): Promise<void> {
  const b = webhook.body;
  if (!b || !b.idMessage || !b.timestamp) return;
  const senderData = b.senderData || {};
  const messageData = b.messageData || {};

  const mediaUrl =
    messageData.downloadUrl || messageData.fileMessageData?.downloadUrl || null;
  const mediaMimeType =
    messageData.mimeType || messageData.fileMessageData?.mimeType || null;
  const mediaFileName =
    messageData.fileName || messageData.fileMessageData?.fileName || null;
  const mediaCaption =
    messageData.caption || messageData.fileMessageData?.caption || null;

  const text =
    messageData.textMessage ||
    messageData.textMessageData?.textMessage ||
    messageData.extendedTextMessage?.text ||
    messageData.extendedTextMessageData?.text ||
    null;
  const chatId = senderData.chatId || b.chatId || null;
  const from = senderData.sender || null;
  const fromName = senderData.senderName || null;

  // idempotent save
  const existing = await prisma.whatsAppMessage.findUnique({
    where: { waMessageId: b.idMessage },
  });
  if (existing) return;

  await prisma.whatsAppMessage.create({
    data: {
      waMessageId: b.idMessage,
      chatId: chatId,
      from: from,
      fromName: fromName,
      text: text,
      type: messageData.typeMessage,
      timestamp: BigInt(b.timestamp),
      fromMe: b.typeWebhook?.includes('outgoing') ? true : false,
      mediaUrl: mediaUrl,
      mediaMimeType: mediaMimeType,
      mediaFileSize: null,
      rawPayload: b,
    },
  });
}

async function main() {
  if (!env.GREEN_API_INSTANCE_ID || !env.GREEN_API_TOKEN) {
    console.error('GREEN API creds missing');
    process.exit(1);
  }
  const base = `${env.GREEN_API_BASE_URL || 'https://api.green-api.com'}/waInstance${
    env.GREEN_API_INSTANCE_ID
  }`;

  const max = Number(process.env.POLL_MAX || 200);
  let processed = 0;

  for (let i = 0; i < max; i++) {
    const item = await receiveOnce(base);
    if (!item) break;
    try {
      await saveMessageFromWebhook(item);
    } catch (e) {
      console.error('save error', e);
    } finally {
      await deleteReceipt(base, item.receiptId);
      processed++;
    }
  }

  console.log(`Processed ${processed} webhook(s)`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
