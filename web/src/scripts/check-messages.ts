#!/usr/bin/env tsx

// Load environment variables from .env.local BEFORE any other imports
import './load-env';

import { prisma } from '../lib/db-node';

async function checkMessages() {
  try {
    const messages = await prisma.whatsAppMessage.findMany({
      select: {
        id: true,
        from: true,
        fromName: true,
        text: true,
        type: true,
        createdAt: true,
        providerId: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('Total messages:', messages.length);

    // Group by from field
    const byFrom = messages.reduce(
      (acc, msg) => {
        if (msg.from && !acc[msg.from]) acc[msg.from] = [];
        if (msg.from) acc[msg.from].push(msg as any);
        return acc;
      },
      {} as Record<
        string,
        Array<{
          id: string;
          from: string;
          fromName: string | null;
          text: string | null;
          type: string;
          createdAt: Date;
          providerId: string | null;
        }>
      >
    );

    console.log('\nMessages by sender:');
    Object.entries(byFrom).forEach(([from, msgs]) => {
      const names = [...new Set(msgs.map(m => m.fromName))];
      const types = [...new Set(msgs.map(m => m.type))];
      console.log(`${from} (${names.join(', ')}): ${msgs.length} messages`);
      console.log(`  Types: ${types.join(', ')}`);

      // Show some sample messages
      console.log('  Sample messages:');
      msgs.slice(0, 3).forEach((msg, i) => {
        const text = msg.text ? msg.text.substring(0, 50) + '...' : 'no text';
        console.log(`    ${i + 1}. ${msg.type}: ${text}`);
      });
      console.log('');
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkMessages();
