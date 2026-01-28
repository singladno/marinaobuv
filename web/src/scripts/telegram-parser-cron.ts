/**
 * Telegram Parser Cron Job
 * Runs every 24 hours to parse messages from Telegram channel
 */

import './load-env';
import { scriptPrisma as prisma } from '../lib/script-db';
import { TelegramParser } from '../lib/services/telegram-parser';
import { ParsingCoordinator } from '../lib/services/parsing-coordinator';
import { ParsingProgressService } from '../lib/services/parsing-progress-service';

async function main() {
  console.log('🚀 Starting Telegram Parser Cron Job...');

  try {
    // Check if parsing can proceed
    const canProceed = await ParsingCoordinator.canStartParsing({
      type: 'cron',
      reason: 'Telegram parser cron job',
    });

    if (!canProceed.canProceed) {
      console.log('⏸️ Parsing cannot proceed:', canProceed.reason);
      return;
    }

    // Create parsing history record
    const parsingHistoryId = await ParsingCoordinator.createParsingHistory(
      'cron',
      'Telegram parser cron job'
    );
    console.log(`📊 Created parsing history record: ${parsingHistoryId}`);

    // Initialize progress service
    const progressService = new ParsingProgressService();
    progressService.setParsingHistoryId(parsingHistoryId);

    // Initialize parser
    const parser = new TelegramParser(prisma);

    // Parse messages from last 48 hours
    const result = await parser.parseChannelMessages(48);

    // Update progress
    await progressService.updateProgress({
      status: 'completed',
      messagesRead: result.messagesRead,
      productsCreated: result.productsCreated,
    });

    console.log('✅ Telegram Parser completed successfully');
    console.log(`📊 Messages read: ${result.messagesRead}`);
    console.log(`📊 Products created: ${result.productsCreated}`);
  } catch (error) {
    console.error('❌ Error in Telegram Parser:', error);

    // Mark parsing as failed
    try {
      const progressService = new ParsingProgressService();
      await progressService.updateProgress({
        status: 'failed',
        errorMessage:
          error instanceof Error ? error.message : 'Unknown error',
        messagesRead: 0,
        productsCreated: 0,
      });
    } catch (progressError) {
      console.error('❌ Failed to update parsing progress:', progressError);
    }

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
