#!/usr/bin/env tsx

/**
 * Test script for Telegram parser
 * Run locally to test the parser without cron job
 * Usage: npx tsx scripts/test-telegram-parser.ts
 */

import '../src/scripts/load-env';
import { scriptPrisma as prisma } from '../src/lib/script-db';
import { TelegramParser } from '../src/lib/services/telegram-parser';

async function main() {
  console.log('🧪 Testing Telegram Parser...\n');

  try {
    const parser = new TelegramParser(prisma);

    // Parse messages from last 48 hours
    console.log('📨 Fetching and parsing messages from last 48 hours...\n');
    const result = await parser.parseChannelMessages(48);

    console.log('\n✅ Test completed successfully!');
    console.log(`📊 Messages read: ${result.messagesRead}`);
    console.log(`📊 Products created: ${result.productsCreated}`);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
