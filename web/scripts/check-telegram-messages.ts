#!/usr/bin/env tsx

import '../src/scripts/load-env';
import { scriptPrisma as prisma } from '../src/lib/script-db';

async function main() {
  const msgs = await prisma.telegramMessage.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      tgMessageId: true,
      type: true,
      text: true,
      caption: true,
      mediaUrl: true,
      fromUsername: true,
      createdAt: true,
    },
  });

  console.log(`Found ${msgs.length} messages:\n`);
  msgs.forEach((m, i) => {
    console.log(`${i + 1}. Message ${m.tgMessageId}:`);
    console.log(`   Type: ${m.type}`);
    console.log(`   Has text: ${!!(m.text || m.caption)}`);
    console.log(`   Has media: ${!!m.mediaUrl}`);
    console.log(`   Media URL: ${m.mediaUrl || 'none'}`);
    console.log(`   From: ${m.fromUsername || 'unknown'}`);
    console.log('');
  });

  await prisma.$disconnect();
}

main();
