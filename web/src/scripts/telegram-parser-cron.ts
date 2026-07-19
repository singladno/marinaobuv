/**
 * Telegram Parser Cron Job
 * Runs every 24 hours to parse messages from all configured Telegram channels
 */

import './load-env';
import { scriptPrisma as prisma } from '../lib/script-db';
import { TelegramParser } from '../lib/services/telegram-parser';
import { ParsingCoordinator } from '../lib/services/parsing-coordinator';
import { ParsingProgressService } from '../lib/services/parsing-progress-service';
import { getTelegramChannels } from '../lib/telegram-channels';

async function main() {
  console.log('🚀 Starting Telegram Parser Cron Job...');

  const channels = getTelegramChannels();
  if (channels.length === 0) {
    console.error(
      '❌ No Telegram channels configured. Set TELEGRAM_CHANNELS or TELEGRAM_CHANNEL_ID'
    );
    process.exit(1);
  }

  console.log(
    `📋 Channels: ${channels.map(c => `${c.id}(${c.profile})`).join(', ')}`
  );

  try {
    const canProceed = await ParsingCoordinator.canStartParsing({
      type: 'cron',
      reason: 'Telegram parser cron job',
    });

    if (!canProceed.canProceed) {
      console.log('⏸️ Parsing cannot proceed:', canProceed.reason);
      return;
    }

    const parser = new TelegramParser(prisma);
    let totalMessages = 0;
    let totalProducts = 0;

    for (const channel of channels) {
      console.log(`\n📡 Parsing ${channel.id} (${channel.profile})...`);

      const parsingHistoryId = await ParsingCoordinator.createParsingHistory(
        'cron',
        `Telegram parser cron — ${channel.name}`,
        channel.id
      );
      console.log(`📊 Created parsing history record: ${parsingHistoryId}`);

      const progressService = new ParsingProgressService();
      progressService.setParsingHistoryId(parsingHistoryId);

      try {
        const result = await parser.parseChannel(channel, { hoursBack: 48 });

        await progressService.updateProgress({
          status: 'completed',
          messagesRead: result.messagesRead,
          productsCreated: result.productsCreated,
        });

        totalMessages += result.messagesRead;
        totalProducts += result.productsCreated;

        console.log(
          `✅ ${channel.id}: ${result.messagesRead} messages, ${result.productsCreated} products`
        );
      } catch (error) {
        console.error(`❌ Error parsing ${channel.id}:`, error);
        await progressService.updateProgress({
          status: 'failed',
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
          messagesRead: 0,
          productsCreated: 0,
        });
      }
    }

    console.log('\n✅ Telegram Parser completed');
    console.log(`📊 Total messages read: ${totalMessages}`);
    console.log(`📊 Total products created: ${totalProducts}`);
  } catch (error) {
    console.error('❌ Error in Telegram Parser:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => {
      console.log('✅ Telegram Parser finished');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Telegram Parser failed:', error);
      process.exit(1);
    });
}

export { main };
