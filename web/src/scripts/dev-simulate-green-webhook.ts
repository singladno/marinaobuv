#!/usr/bin/env tsx

/**
 * POST a minimal Green API–shaped webhook to the local Next app (no real WhatsApp).
 * Use while `npm run dev` is running to verify WaAdmin* upserts / product pipeline.
 *
 * Usage:
 *   cd web && npx tsx src/scripts/dev-simulate-green-webhook.ts
 *   WEBHOOK_TARGET=http://localhost:3001/api/webhooks/green-api npx tsx ...
 *   SIMULATE_ADMIN_INSTANCE=true npx tsx ...   # sets instanceData.idInstance from GREEN_API_ADMIN_INSTANCE_ID
 */

import './load-env';
import { env } from '../lib/env';

const target =
  process.env.WEBHOOK_TARGET ||
  `http://localhost:${process.env.PORT || '3000'}/api/webhooks/green-api`;

const useAdminInstance = process.env.SIMULATE_ADMIN_INSTANCE === 'true';
const idInstance = useAdminInstance
  ? Number(env.GREEN_API_ADMIN_INSTANCE_ID || '0') || 11000110011
  : Number(env.GREEN_API_INSTANCE_ID || '0') || 22000220022;

async function main() {
  const now = Math.floor(Date.now() / 1000);
  const idMessage = `SIM-${now}-${Math.random().toString(36).slice(2, 10)}`;

  const payload = {
    typeWebhook: 'incomingMessageReceived',
    instanceData: {
      idInstance,
      wid: '79000000000@c.us',
      typeInstance: 'whatsapp',
    },
    timestamp: now,
    idMessage,
    senderData: {
      chatId: '79001234567@c.us',
      chatName: 'Local test chat',
      sender: '79001234567@c.us',
      senderName: 'Test User',
    },
    messageData: {
      typeMessage: 'textMessage',
      textMessage: `Local webhook simulation at ${new Date().toISOString()}`,
    },
  };

  console.log(`POST ${target}`);
  console.log(
    `instanceData.idInstance=${idInstance} (${useAdminInstance ? 'admin env' : 'parser env'})`
  );

  const res = await fetch(target, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  console.log('Status:', res.status, text.slice(0, 500));
  if (!res.ok) process.exit(1);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
