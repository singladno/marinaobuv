#!/usr/bin/env tsx
/**
 * Backfill ParsingHistory for WhatsApp chats.
 *
 * Creates one completed ParsingHistory record per WhatsApp chat that has
 * messages or products but no existing Groq parsing history, so admin
 * parsing pages show entries after a DB restore or when history was missing.
 *
 * Usage:
 *   cd web && npx tsx src/scripts/backfill-parsing-history-wa.ts
 *   cd web && npx tsx src/scripts/backfill-parsing-history-wa.ts --force   # add one backfill record per chat even if history exists
 */

import './load-env';
import { scriptPrisma as prisma } from '../lib/script-db';
import { getWaChatIds } from '../lib/env';
import { ProductSource } from '@prisma/client';

const REASON_GROQ = 'Groq sequential processing cron job';

async function main() {
  const force = process.argv.includes('--force');
  console.log('🔄 Backfilling ParsingHistory for WhatsApp chats...\n');

  // Chats to consider: configured in .env + any chat that has messages in DB
  const configuredChatIds = getWaChatIds();
  const distinctFromDb = await prisma.whatsAppMessage.findMany({
    where: { chatId: { not: null } },
    select: { chatId: true },
    distinct: ['chatId'],
  });
  const chatIdsFromDb = [
    ...new Set(
      distinctFromDb.map((r) => r.chatId).filter((id): id is string => !!id)
    ),
  ];
  const allChatIds = [...new Set([...configuredChatIds, ...chatIdsFromDb])];

  if (allChatIds.length === 0) {
    console.log('⏸️ No WhatsApp chats found (set WA_CHAT_IDS or TARGET_GROUP_ID, or ensure WhatsAppMessage has chatId).');
    return;
  }

  console.log(`📂 Chats to consider: ${allChatIds.length} (configured: ${configuredChatIds.length}, from DB: ${chatIdsFromDb.length})\n`);

  // Existing WA parsing history: which chatIds already have at least one record?
  const existing = await prisma.parsingHistory.findMany({
    where: {
      reason: { contains: 'Groq' },
      sourceId: { not: null },
    },
    select: { sourceId: true },
  });
  const chatIdsWithHistory = new Set(
    existing.map((r) => r.sourceId).filter((id): id is string => !!id)
  );

  const toBackfill = force
    ? allChatIds
    : allChatIds.filter((id) => !chatIdsWithHistory.has(id));
  const skipped = allChatIds.length - toBackfill.length;

  if (skipped > 0) {
    console.log(`⏭️ Skipping ${skipped} chat(s) that already have parsing history (use --force to add a backfill record anyway).\n`);
  }
  if (toBackfill.length === 0) {
    console.log('✅ Nothing to backfill.');
    return;
  }

  // Preload: message ids per chat and message counts
  const messageIdsByChat = new Map<string, string[]>();
  const messageCountByChat = new Map<string, number>();
  const earliestByChat = new Map<string, Date>();

  for (const chatId of toBackfill) {
    const messages = await prisma.whatsAppMessage.findMany({
      where: { chatId },
      select: { id: true, createdAt: true },
    });
    messageIdsByChat.set(chatId, messages.map((m) => m.id));
    messageCountByChat.set(chatId, messages.length);
    if (messages.length > 0) {
      const earliest = messages.reduce(
        (min, m) => (m.createdAt < min ? m.createdAt : min),
        messages[0].createdAt
      );
      earliestByChat.set(chatId, earliest);
    }
  }

  // Preload: WA products with sourceMessageIds — count distinct products that have at least one source message in this chat
  const waProducts = await prisma.product.findMany({
    where: { source: ProductSource.WA },
    select: { id: true, sourceMessageIds: true },
  });

  const chatMessageIdSet = new Map<string, Set<string>>();
  for (const chatId of toBackfill) {
    chatMessageIdSet.set(chatId, new Set(messageIdsByChat.get(chatId) ?? []));
  }

  function countProductsForChat(chatId: string): number {
    const msgIds = chatMessageIdSet.get(chatId);
    if (!msgIds || msgIds.size === 0) return 0;
    let count = 0;
    for (const p of waProducts) {
      const ids = Array.isArray(p.sourceMessageIds)
        ? (p.sourceMessageIds as string[])
        : [];
      if (ids.some((id) => msgIds.has(id))) count++;
    }
    return count;
  }

  let created = 0;
  const now = new Date();

  for (const chatId of toBackfill) {
    const messagesRead = messageCountByChat.get(chatId) ?? 0;
    const productsCreated = countProductsForChat(chatId);
    const startedAt = earliestByChat.get(chatId) ?? new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const completedAt = now;
    const duration = Math.max(0, Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000));

    await prisma.parsingHistory.create({
      data: {
        startedAt,
        completedAt,
        status: 'completed',
        messagesRead,
        productsCreated,
        duration,
        triggeredBy: 'backfill',
        reason: REASON_GROQ,
        sourceId: chatId,
      },
    });
    created++;
    console.log(
      `  ✅ ${chatId} — messages: ${messagesRead}, products: ${productsCreated}`
    );
  }

  console.log(`\n✅ Backfill complete: ${created} ParsingHistory record(s) created.`);
  console.log('   View at /admin/parsing and per-chat at /admin/parsing/wa?sourceId=<chatId>');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Backfill failed:', err);
    process.exit(1);
  });
