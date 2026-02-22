import { GroqSequentialProcessor } from '../lib/services/groq-sequential-processor';
import { fetchExtendedBatch } from '../lib/utils/batch-extender';
import { ParsingCoordinator } from '../lib/services/parsing-coordinator';
import { ParsingProgressService } from '../lib/services/parsing-progress-service';
import { env, getWaChatIds } from '../lib/env';
import { scriptPrisma as prisma } from '../lib/script-db';
import { initializeTokenLogger, closeTokenLogger } from '../lib/utils/groq-token-logger';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Setup file logging for Groq parsing
 * Logs to web/logs/groq-parse.log (overwrites on each run)
 */
function setupFileLogging(): { logStream: fs.WriteStream; originalLog: typeof console.log; originalError: typeof console.error } {
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const logFile = path.join(logsDir, 'groq-parse.log');
  const logStream = fs.createWriteStream(logFile, { flags: 'w' }); // 'w' flag overwrites the file

  const timestamp = () => new Date().toISOString();

  // Save original console methods
  const originalLog = console.log;
  const originalError = console.error;

  // Override console.log
  console.log = (...args: any[]) => {
    const message = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    const logMessage = `[${timestamp()}] ${message}\n`;
    logStream.write(logMessage);
    originalLog(...args);
  };

  // Override console.error
  console.error = (...args: any[]) => {
    const message = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    const logMessage = `[${timestamp()}] ERROR: ${message}\n`;
    logStream.write(logMessage);
    originalError(...args);
  };

  console.log(`📝 Logging to: ${logFile}`);
  console.log('🔄 Log file will be overwritten on each run');

  return { logStream, originalLog, originalError };
}

/**
 * Restore original console methods
 */
function restoreConsole(logStream: fs.WriteStream, originalLog: typeof console.log, originalError: typeof console.error) {
  console.log = originalLog;
  console.error = originalError;
  logStream.end();
}

/**
 * Groq Sequential Processing Cron Job
 * Processes messages in sequence: Group → Analysis → Colors
 * Only processes unprocessed messages from the last N hours (configurable via MESSAGE_PROCESSING_HOURS)
 * Continues processing in cycles until no more recent unprocessed messages remain
 */
async function main() {
  // Setup file logging first
  const { logStream, originalLog, originalError } = setupFileLogging();

  // Declare variables outside try block so they're accessible in catch and shutdown
  let progressService: ParsingProgressService | null = null;
  let isShuttingDown = false;
  let totalProcessed = 0;
  let totalProductsCreated = 0;
  let currentChatProcessed = 0;
  let currentChatProductsCreated = 0;

  try {
    console.log('🚀 Starting Groq Sequential Processing Cron Job...');

    // Initialize token usage logger
    initializeTokenLogger();
    console.log('📊 Token usage logging initialized');

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      if (isShuttingDown) {
        console.log('⚠️ Shutdown already in progress, forcing exit...');
        process.exit(1);
      }

      isShuttingDown = true;
    console.log(`\n🛑 Received ${signal}, initiating graceful shutdown...`);

    // Set a timeout to force exit if graceful shutdown takes too long
    const shutdownTimeout = setTimeout(() => {
      console.log('⚠️ Graceful shutdown timeout, forcing exit...');
      process.exit(1);
    }, 10000); // 10 second timeout

    try {
      if (progressService) {
        console.log('📊 Updating parsing status to failed due to shutdown...');
        await progressService.updateProgress({
          status: 'failed',
          errorMessage: `Process terminated by ${signal} signal`,
          messagesRead: currentChatProcessed,
          productsCreated: currentChatProductsCreated,
        });
        console.log('✅ Parsing status updated successfully');
      }

      clearTimeout(shutdownTimeout);
      console.log('👋 Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error(
        '❌ Failed to update parsing status during shutdown:',
        error
      );
      clearTimeout(shutdownTimeout);
      process.exit(1);
    }
    };

    // Register signal handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGHUP', () => gracefulShutdown('SIGHUP'));
    process.on('SIGUSR1', () => gracefulShutdown('SIGUSR1'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));

    // Handle uncaught exceptions
    process.on('uncaughtException', async error => {
      console.error('❌ Uncaught Exception:', error);
    if (progressService) {
      try {
        await progressService.updateProgress({
          status: 'failed',
          errorMessage: `Uncaught exception: ${error.message}`,
          messagesRead: currentChatProcessed,
          productsCreated: currentChatProductsCreated,
        });
      } catch (updateError) {
        console.error('❌ Failed to update parsing status:', updateError);
      }
    }
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    if (progressService) {
      try {
        await progressService.updateProgress({
          status: 'failed',
          errorMessage: `Unhandled rejection: ${reason}`,
          messagesRead: currentChatProcessed,
          productsCreated: currentChatProductsCreated,
        });
      } catch (updateError) {
        console.error('❌ Failed to update parsing status:', updateError);
      }
    }
      process.exit(1);
    });

    // Check if parsing can proceed
    const canProceed = await ParsingCoordinator.canStartParsing({
      type: 'cron',
      reason: 'Groq sequential processing cron job',
    });

    if (!canProceed.canProceed) {
      console.log('⏸️ Parsing cannot proceed:', canProceed.reason);
      return;
    }

    const chatIds = getWaChatIds();
    if (chatIds.length === 0) {
      console.log('⏸️ No WA chat IDs configured (set WA_CHAT_IDS or TARGET_GROUP_ID)');
      return;
    }

    const batchSize = env.PROCESSING_BATCH_SIZE;
    const hoursBack = env.MESSAGE_PROCESSING_HOURS;
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    let cycleCount = 0;
    let totalUnprocessed = 0;

    // Process each chat in order; one ParsingHistory record per chat (with sourceId) for per-chat admin pages
    for (let chatIndex = 0; chatIndex < chatIds.length; chatIndex++) {
      const currentChatId = chatIds[chatIndex];
      if (isShuttingDown) break;

      console.log(
        `\n📂 Chat ${chatIndex + 1}/${chatIds.length}: ${currentChatId} (last ${hoursBack}h)`
      );

      const initialCount = await prisma.whatsAppMessage.count({
        where: {
          processed: false,
          type: { in: ['imageMessage', 'extendedTextMessage', 'textMessage'] },
          chatId: currentChatId,
          createdAt: { gte: cutoffTime },
        },
      });

      if (initialCount === 0) {
        console.log(`   No unprocessed messages for this chat, skipping.`);
        continue;
      }

      totalUnprocessed += initialCount;
      console.log(`   Found ${initialCount} unprocessed messages for this chat.`);

      // One parsing history record per chat (sourceId = currentChatId) for admin per-chat detail pages
      const parsingHistoryId = await ParsingCoordinator.createParsingHistory(
        'cron',
        'Groq sequential processing cron job',
        currentChatId
      );
      console.log(`📊 Created parsing history record for chat: ${parsingHistoryId}`);

      progressService = new ParsingProgressService();
      progressService.setParsingHistoryId(parsingHistoryId);

      const processor = new GroqSequentialProcessor(prisma, progressService);
      let currentOffset = 0;
      let chatProcessed = 0;
      let chatProductsCreated = 0;
      currentChatProcessed = 0;
      currentChatProductsCreated = 0;

      try {
        while (true) {
          if (isShuttingDown) break;

          cycleCount++;
          console.log(`\n🔄 Processing cycle ${cycleCount} (chat: ${currentChatId})...`);

          const extendedBatch = await fetchExtendedBatch(
            batchSize,
            currentChatId,
            currentOffset,
            hoursBack
          );

          if (extendedBatch.totalCount === 0) {
            console.log(`   No more unprocessed messages for this chat.`);
            break;
          }

          const messageIds = extendedBatch.messageIds;
          let cycleProcessed = 0;

          console.log(
            `   Batch: ${extendedBatch.totalCount} messages (extended: +${extendedBatch.extendedCount}, offset: ${currentOffset})`
          );

          try {
            if (isShuttingDown) break;

            const result = await processor.processMessagesToProducts(messageIds);

            if (result.anyProcessed) {
              cycleProcessed = messageIds.length;
              const created = result.productsCreated || 0;
              totalProductsCreated += created;
              chatProductsCreated += created;
            }
            totalProcessed += cycleProcessed;
            chatProcessed += cycleProcessed;
            currentChatProcessed = chatProcessed;
            currentChatProductsCreated = chatProductsCreated;
            if (progressService && !isShuttingDown) {
              await progressService.updateProgress({
                messagesRead: chatProcessed,
                productsCreated: chatProductsCreated,
              });
            }
          } catch (error) {
            console.error(`❌ Error processing batch:`, error);
            if (
              error instanceof Error &&
              error.message.includes('json_validate_failed')
            ) {
              console.log(`   Groq JSON validation error - batch will be retried later`);
            }
          }

          currentOffset =
            extendedBatch.nextOffset ?? currentOffset + messageIds.length;

          console.log(
            `   Progress for this chat: ${chatProcessed} processed, next offset: ${currentOffset}`
          );

          if (!isShuttingDown) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }

        if (!isShuttingDown && progressService) {
          await progressService.updateProgress({
            status: 'completed',
            messagesRead: chatProcessed,
            productsCreated: chatProductsCreated,
          });
        }
      } catch (chatError) {
        console.error(`❌ Error processing chat ${currentChatId}:`, chatError);
        if (progressService) {
          await progressService.updateProgress({
            status: 'failed',
            errorMessage: chatError instanceof Error ? chatError.message : 'Unknown error',
            messagesRead: chatProcessed,
            productsCreated: chatProductsCreated,
          });
        }
      }
    }

    if (isShuttingDown) {
      console.log(`🛑 Processing stopped due to shutdown signal`);
    } else {
      console.log(`✅ Completed processing all chats`);
    }

    console.log(`🎉 Groq Sequential Processing completed!`);
    console.log(`📊 Total cycles: ${cycleCount}`);
    console.log(
      `📊 Total messages processed: ${totalProcessed}${totalUnprocessed ? ` / ${totalUnprocessed}` : ''}`
    );
    console.log(`📊 Total products created: ${totalProductsCreated}`);
  } catch (error) {
    console.error('❌ Error in Groq Sequential Processing:', error);

    // Mark current chat's parsing as failed
    if (progressService) {
      try {
        await progressService.updateProgress({
          status: 'failed',
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
          messagesRead: currentChatProcessed,
          productsCreated: currentChatProductsCreated,
        });
      } catch (progressError) {
        console.error('❌ Failed to update parsing progress:', progressError);
      }
    }

    throw error;
  } finally {
    // Close token logger and print summary
    closeTokenLogger();

    // Restore console and close log stream
    restoreConsole(logStream, originalLog, originalError);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => {
      // Use original console methods since we're in the finally block
      console.log('✅ Groq Sequential Processing finished');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Groq Sequential Processing failed:', error);
      process.exit(1);
    });
}

export { main };
