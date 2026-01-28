#!/usr/bin/env tsx

/**
 * Clear Telegram messages from database
 * Usage: npx tsx scripts/clear-telegram-messages.ts
 */

import '../src/scripts/load-env';
import { scriptPrisma as prisma } from '../src/lib/script-db';

async function main() {
  console.log('🗑️  Clearing Telegram messages from database...\n');

  try {
    // Count messages before deletion
    const count = await prisma.telegramMessage.count();
    console.log(`Found ${count} Telegram messages`);

    if (count === 0) {
      console.log('✅ No messages to delete');
      await prisma.$disconnect();
      return;
    }

    // Delete all Telegram messages
    const result = await prisma.telegramMessage.deleteMany({});

    console.log(`✅ Deleted ${result.count} Telegram messages`);
    console.log('\n💡 You can now run the parser again:');
    console.log('   npx tsx scripts/test-telegram-parser.ts');
  } catch (error) {
    console.error('\n❌ Error clearing messages:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
