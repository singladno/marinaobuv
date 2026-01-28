#!/usr/bin/env tsx

import '../src/scripts/load-env';
import { scriptPrisma as prisma } from '../src/lib/script-db';

async function main() {
  // Get messages around the text messages
  const textMsg = await prisma.telegramMessage.findFirst({
    where: { text: { contains: '32-61/63' } },
    orderBy: { createdAt: 'desc' },
  });

  if (!textMsg) {
    console.log('No text message found');
    await prisma.$disconnect();
    return;
  }

  // Get messages within 5 minutes of this text message
  const fiveMinutesAgo = new Date(textMsg.createdAt.getTime() - 5 * 60 * 1000);
  const fiveMinutesLater = new Date(textMsg.createdAt.getTime() + 5 * 60 * 1000);

  const nearby = await prisma.telegramMessage.findMany({
    where: {
      createdAt: {
        gte: fiveMinutesAgo,
        lte: fiveMinutesLater,
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${nearby.length} messages around text message ${textMsg.tgMessageId}:\n`);
  nearby.forEach((m, i) => {
    const timeDiff = Math.abs(m.createdAt.getTime() - textMsg.createdAt.getTime()) / 1000;
    console.log(`${i + 1}. Message ${m.tgMessageId} (${timeDiff.toFixed(0)}s ${m.createdAt > textMsg.createdAt ? 'after' : 'before'}):`);
    console.log(`   Type: ${m.type}`);
    console.log(`   Has text: ${!!(m.text || m.caption)}`);
    console.log(`   Has media: ${!!m.mediaUrl}`);
    console.log(`   From: ${m.fromUsername || m.fromId || 'unknown'}`);
    if (m.text) {
      console.log(`   Text preview: ${m.text.substring(0, 50)}...`);
    }
    console.log('');
  });

  await prisma.$disconnect();
}

main();
