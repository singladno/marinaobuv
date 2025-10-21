#!/usr/bin/env tsx

// Load environment variables from .env.local BEFORE any other imports
import './load-env';

import { prisma } from '../lib/db-node';
import { processProviderFromMessage } from '../lib/provider-utils';

async function backfillProviders(batchSize = 200) {
  let updated = 0;
  while (true) {
    const messages = await prisma.whatsAppMessage.findMany({
      where: { providerId: null, fromMe: false },
      select: { id: true, from: true, fromName: true, rawPayload: true },
      take: batchSize,
    });
    if (messages.length === 0) break;
    for (const m of messages) {
      try {
        const providerId = await processProviderFromMessage({
          from: m.from,
          fromName: m.fromName,
          pushName: (m.rawPayload as { from_name?: string })?.from_name ?? null,
        });
        if (providerId) {
          await prisma.whatsAppMessage.update({
            where: { id: m.id },
            data: { providerId },
          });
          updated++;
        }
      } catch (e) {
        console.error('Failed to update message provider', m.id, e);
      }
    }
    if (messages.length < batchSize) break;
  }
  console.log(`Backfilled providers on ${updated} messages`);
}

async function main() {
  try {
    console.log('Starting WhatsAppMessage cleanup...');
    await backfillProviders();
    console.log('Cleanup complete.');
  } catch (e) {
    console.error('Cleanup failed:', e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
