#!/usr/bin/env tsx

/**
 * Test script for Telegram parser
 *
 * Usage:
 *   npx tsx scripts/test-telegram-parser.ts
 *   npx tsx scripts/test-telegram-parser.ts --channel @dilshod_cosmetica
 *   npx tsx scripts/test-telegram-parser.ts --channel @dilshod_cosmetica --hours 72
 *   npx tsx scripts/test-telegram-parser.ts --channel @dilshod_cosmetica --months 6
 */

import '../src/scripts/load-env';
import { scriptPrisma as prisma } from '../src/lib/script-db';
import { TelegramParser } from '../src/lib/services/telegram-parser';
import {
  getTelegramChannelById,
  getTelegramChannels,
  normalizeChannelId,
} from '../src/lib/telegram-channels';

function parseArgs(argv: string[]) {
  let channel: string | undefined;
  let hours = 48;
  let months: number | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--channel' && argv[i + 1]) {
      channel = argv[++i];
    } else if (arg === '--hours' && argv[i + 1]) {
      hours = parseInt(argv[++i], 10);
    } else if (arg === '--months' && argv[i + 1]) {
      months = Math.max(1, parseInt(argv[++i], 10) || 6);
    } else if (arg === '--all') {
      months = 6;
    }
  }

  return { channel, hours, months };
}

async function main() {
  console.log('🧪 Testing Telegram Parser...\n');

  const {
    channel: channelArg,
    hours,
    months,
  } = parseArgs(process.argv.slice(2));
  const parser = new TelegramParser(prisma);

  try {
    if (channelArg) {
      const channelId = normalizeChannelId(channelArg);
      const channel = getTelegramChannelById(channelId);
      if (!channel) {
        console.error(
          `Channel ${channelId} not found in TELEGRAM_CHANNELS / TELEGRAM_CHANNEL_ID`
        );
        console.error(
          'Configured:',
          getTelegramChannels()
            .map(c => `${c.id}:${c.profile}`)
            .join(', ') || '(none)'
        );
        process.exit(1);
      }

      console.log(
        months != null
          ? `📨 Last ${months} months for ${channel.id} (${channel.profile})...\n`
          : `📨 Last ${hours}h for ${channel.id} (${channel.profile})...\n`
      );

      const result = await parser.parseChannel(channel, {
        hoursBack: hours,
        monthsBack: months,
      });

      console.log('\n✅ Test completed successfully!');
      console.log(`📊 Messages read: ${result.messagesRead}`);
      console.log(`📊 Products created: ${result.productsCreated}`);
    } else {
      console.log(`📨 All configured channels, last ${hours} hours...\n`);
      const result = await parser.parseChannelMessages(hours);
      console.log('\n✅ Test completed successfully!');
      console.log(`📊 Messages read: ${result.messagesRead}`);
      console.log(`📊 Products created: ${result.productsCreated}`);
    }
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
