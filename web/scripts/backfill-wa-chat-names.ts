#!/usr/bin/env tsx
/**
 * Backfill WhatsAppChat names from Green API GetGroupData.
 * Run after the WhatsAppChat table exists (prisma migrate deploy).
 * Requires: GREEN_API_INSTANCE_ID, GREEN_API_TOKEN, DATABASE_URL.
 *
 * Usage: npm run backfill:wa-chat-names   (from repo root)
 *    or: cd web && npx tsx scripts/backfill-wa-chat-names.ts
 */

import '../src/scripts/load-env';
import { env } from '../src/lib/env';
import { prisma } from '../src/lib/db-node';

const baseUrl =
  (env.GREEN_API_BASE_URL || 'https://api.green-api.com').replace(/\/$/, '');
const instanceId = env.GREEN_API_INSTANCE_ID;
const token = env.GREEN_API_TOKEN;

async function getGroupData(
  groupId: string
): Promise<{ subject?: string } | null> {
  const url = `${baseUrl}/waInstance${instanceId}/getGroupData/${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groupId }),
  });
  if (!res.ok) return null;
  let data: any;
  try {
    data = await res.json();
  } catch {
    return null;
  }
  if (typeof data === 'string' || data.errorId || data.error) return null;
  return { subject: data.subject };
}

async function main() {
  if (!instanceId || !token) {
    console.error('Set GREEN_API_INSTANCE_ID and GREEN_API_TOKEN to run backfill.');
    process.exit(1);
  }

  const chatIds = await prisma.whatsAppMessage.findMany({
    where: { chatId: { not: null } },
    select: { chatId: true },
    distinct: ['chatId'],
  });
  const ids = [...new Set(chatIds.map((r) => r.chatId).filter(Boolean))] as string[];
  const groups = ids.filter((id) => id.endsWith('@g.us'));
  console.log(`Found ${groups.length} group chat(s) to backfill.\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const chatId of groups) {
    const info = await getGroupData(chatId);
    if (info?.subject != null && String(info.subject).trim()) {
      await prisma.whatsAppChat.upsert({
        where: { chatId },
        create: { chatId, name: String(info.subject).trim() },
        update: { name: String(info.subject).trim() },
      });
      console.log(`  ${chatId} → "${info.subject}"`);
      updated++;
    } else {
      const existing = await prisma.whatsAppChat.findUnique({
        where: { chatId },
        select: { name: true },
      });
      if (existing?.name) skipped++;
      else failed++;
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log(`\nDone. Updated: ${updated}, skipped (no name): ${failed}, already had name: ${skipped}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
