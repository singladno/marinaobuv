#!/usr/bin/env tsx

import '../src/scripts/load-env';
import { scriptPrisma as prisma } from '../src/lib/script-db';

async function main() {
  const msgs = await prisma.telegramMessage.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    select: {
      tgMessageId: true,
      type: true,
      text: true,
      caption: true,
      mediaUrl: true,
      rawPayload: true,
    },
  });

  console.log(`Found ${msgs.length} messages:\n`);
  msgs.forEach((m) => {
    const raw = m.rawPayload as any;
    const hasMedia = raw?.media ? 'YES' : 'NO';
    const mediaType = raw?.media?.className || 'none';
    const hasText = !!(m.text || m.caption);
    console.log(`Msg ${m.tgMessageId}: type=${m.type}, hasMedia=${hasMedia}, mediaType=${mediaType}, hasText=${hasText}, mediaUrl=${m.mediaUrl || 'none'}`);
  });

  const photoCount = msgs.filter(m => m.type === 'photo').length;
  const textCount = msgs.filter(m => !!(m.text || m.caption)).length;
  console.log(`\nSummary: ${photoCount} photos, ${textCount} with text`);

  await prisma.$disconnect();
}

main();
