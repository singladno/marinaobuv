#!/usr/bin/env tsx

import '../src/scripts/load-env';
import { scriptPrisma as prisma } from '../src/lib/script-db';

async function main() {
  const msgs = await prisma.telegramMessage.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    where: {
      OR: [
        { text: { not: null } },
        { caption: { not: null } },
      ],
    },
  });

  console.log(`Found ${msgs.length} messages with text:\n`);
  msgs.forEach((m, i) => {
    const raw = m.rawPayload as any;
    console.log(`${i + 1}. Message ${m.tgMessageId}:`);
    console.log(`   Type: ${m.type}`);
    console.log(`   Text: ${m.text || m.caption || 'none'}`);
    console.log(`   Has media in raw: ${!!raw?.media}`);
    console.log(`   Media type: ${raw?.media?.className || 'none'}`);
    if (raw?.media) {
      console.log(`   Media details:`, JSON.stringify(raw.media, null, 2).substring(0, 200));
    }
    console.log('');
  });

  await prisma.$disconnect();
}

main();
