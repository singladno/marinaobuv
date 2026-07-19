/**
 * One-time (or re-runnable) full-history backfill for a Telegram channel.
 *
 * Usage:
 *   npx tsx src/scripts/backfill-telegram-channel.ts --channel @dilshod_cosmetica
 *   npx tsx src/scripts/backfill-telegram-channel.ts --channel @dilshod_cosmetica --profile cosmetics
 *
 * Channel must be listed in TELEGRAM_CHANNELS (or pass --profile for ad-hoc).
 * Requires MTProto auth (TELEGRAM_API_ID/HASH/PHONE/SESSION_STRING).
 */

import './load-env';
import { scriptPrisma as prisma } from '../lib/script-db';
import { TelegramParser } from '../lib/services/telegram-parser';
import { ParsingCoordinator } from '../lib/services/parsing-coordinator';
import { ParsingProgressService } from '../lib/services/parsing-progress-service';
import {
  getTelegramChannelById,
  normalizeChannelId,
  type TelegramChannelConfig,
  type TelegramParserProfile,
} from '../lib/telegram-channels';

function parseArgs(argv: string[]) {
  let channel: string | undefined;
  let profile: TelegramParserProfile | undefined;
  let name: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--channel' && argv[i + 1]) {
      channel = argv[++i];
    } else if (arg === '--profile' && argv[i + 1]) {
      const p = argv[++i].toLowerCase();
      if (p === 'flowers' || p === 'cosmetics') profile = p;
      else throw new Error(`Invalid --profile ${p}`);
    } else if (arg === '--name' && argv[i + 1]) {
      name = argv[++i];
    }
  }

  return { channel, profile, name };
}

async function main() {
  const {
    channel: channelArg,
    profile,
    name,
  } = parseArgs(process.argv.slice(2));

  if (!channelArg) {
    console.error(
      'Usage: npx tsx src/scripts/backfill-telegram-channel.ts --channel @dilshod_cosmetica [--profile cosmetics]'
    );
    process.exit(1);
  }

  const channelId = normalizeChannelId(channelArg);
  let channel: TelegramChannelConfig | undefined =
    getTelegramChannelById(channelId);

  if (!channel) {
    if (!profile) {
      console.error(
        `Channel ${channelId} not in TELEGRAM_CHANNELS. Pass --profile flowers|cosmetics`
      );
      process.exit(1);
    }
    channel = {
      id: channelId,
      profile,
      name: name || (profile === 'cosmetics' ? 'SABBI Косметика' : channelId),
    };
  } else if (profile) {
    channel = { ...channel, profile, name: name || channel.name };
  }

  console.log(
    `🚀 Backfill Telegram channel ${channel.id} (profile=${channel.profile})...`
  );

  const canProceed = await ParsingCoordinator.canStartParsing({
    type: 'manual',
    reason: `Telegram backfill ${channel.id}`,
  });

  if (!canProceed.canProceed) {
    console.log('⏸️ Parsing cannot proceed:', canProceed.reason);
    process.exit(0);
  }

  const parsingHistoryId = await ParsingCoordinator.createParsingHistory(
    'manual',
    `Telegram backfill ${channel.id}`,
    channel.id
  );
  console.log(`📊 Parsing history: ${parsingHistoryId}`);

  const progressService = new ParsingProgressService();
  progressService.setParsingHistoryId(parsingHistoryId);

  const parser = new TelegramParser(prisma);

  try {
    const result = await parser.parseChannel(channel, { fetchAll: true });

    await progressService.updateProgress({
      status: 'completed',
      messagesRead: result.messagesRead,
      productsCreated: result.productsCreated,
    });

    console.log('✅ Backfill completed');
    console.log(`📊 Messages read: ${result.messagesRead}`);
    console.log(`📊 Products created: ${result.productsCreated}`);
  } catch (error) {
    console.error('❌ Backfill failed:', error);
    await progressService.updateProgress({
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      messagesRead: 0,
      productsCreated: 0,
    });
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
