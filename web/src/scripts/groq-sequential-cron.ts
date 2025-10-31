import { GroqSequentialProcessor } from '../lib/services/groq-sequential-processor';
import { fetchExtendedBatch } from '../lib/utils/batch-extender';
import { ParsingCoordinator } from '../lib/services/parsing-coordinator';
import { ParsingProgressService } from '../lib/services/parsing-progress-service';
import { env } from '../lib/env';
import { scriptPrisma as prisma } from '../lib/script-db';
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

  // Declare variables outside try block so they're accessible in catch
  let progressService: ParsingProgressService | null = null;
  let isShuttingDown = false;
  let totalProcessed = 0;
  let totalProductsCreated = 0;

  try {
    console.log('🚀 Starting Groq Sequential Processing Cron Job...');

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
          messagesRead: totalProcessed,
          productsCreated: totalProductsCreated,
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
          messagesRead: totalProcessed,
          productsCreated: totalProductsCreated,
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
          messagesRead: totalProcessed,
          productsCreated: totalProductsCreated,
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

    // Create parsing history record
    const parsingHistoryId = await ParsingCoordinator.createParsingHistory(
      'cron',
      'Groq sequential processing cron job'
    );
    console.log(`📊 Created parsing history record: ${parsingHistoryId}`);

    // Initialize progress service
    progressService = new ParsingProgressService();
    progressService.setParsingHistoryId(parsingHistoryId);

    const batchSize = env.PROCESSING_BATCH_SIZE;
    const hoursBack = env.MESSAGE_PROCESSING_HOURS;
    const processor = new GroqSequentialProcessor(prisma, progressService);
    let cycleCount = 0;
    let totalUnprocessed = 0;

    // Calculate the cutoff time for messages (N hours back from now)
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    // Get initial count of unprocessed messages from the last N hours
    const initialCount = await prisma.whatsAppMessage.count({
      where: {
        processed: false,
        type: { in: ['imageMessage', 'extendedTextMessage', 'textMessage'] },
        chatId: env.TARGET_GROUP_ID,
        createdAt: {
          gte: cutoffTime, // Only messages from the last N hours
        },
      },
    });

    if (initialCount === 0) {
      console.log('✅ No unprocessed messages found');
      // Update progress and mark as completed
      if (progressService) {
        await progressService.updateProgress({
          status: 'completed',
          messagesRead: 0,
          productsCreated: 0,
        });
      }
      return;
    }

    totalUnprocessed = initialCount;
    console.log(
      `📊 Found ${totalUnprocessed} unprocessed messages from the last ${hoursBack} hours to process`
    );

    // Continue processing until no more unprocessed messages
    let currentOffset = 0;

    while (true) {
      // Check if we're shutting down
      if (isShuttingDown) {
        console.log('🛑 Shutdown requested, stopping processing...');
        break;
      }

      cycleCount++;
      console.log(`\n🔄 Starting processing cycle ${cycleCount}...`);

      // Get extended batch of unprocessed messages with offset to prevent overlap
      const extendedBatch = await fetchExtendedBatch(
        batchSize,
        env.TARGET_GROUP_ID,
        currentOffset,
        hoursBack
      );

      if (extendedBatch.totalCount === 0) {
        console.log('✅ No more unprocessed messages found');
        break;
      }

      console.log(
        `📊 Processing ${extendedBatch.totalCount} messages ` +
          `(batch size: ${batchSize}, extended: +${extendedBatch.extendedCount}, offset: ${currentOffset})`
      );

      // Process the entire extended batch as one unit
      const messageIds = extendedBatch.messageIds;
      let cycleProcessed = 0;

      console.log(
        `🔄 Processing batch ${cycleCount} ` +
          `(${messageIds.length} messages: offset ${currentOffset} to ${currentOffset + messageIds.length})`
      );

      try {
        // Check if we're shutting down before processing
        if (isShuttingDown) {
          console.log('🛑 Shutdown requested, skipping batch processing...');
          break;
        }

        const result = await processor.processMessagesToProducts(messageIds);

        if (result.anyProcessed) {
          console.log(`✅ Batch processed successfully`);
          cycleProcessed += messageIds.length;
          totalProductsCreated += result.productsCreated || 0; // Add to cumulative total
        } else {
          console.log(`⚠️ No products created from this batch`);
        }

        // Update progress after each batch with cumulative totals
        if (progressService && !isShuttingDown) {
          const currentTotalMessages = totalProcessed + cycleProcessed;
          await progressService.updateProgress({
            messagesRead: currentTotalMessages,
            productsCreated: totalProductsCreated, // Use cumulative total
          });
        }
      } catch (error) {
        console.error(`❌ Error processing batch:`, error);

        // Check if it's a JSON validation error from Groq
        if (
          error instanceof Error &&
          error.message.includes('json_validate_failed')
        ) {
          console.log(
            `🔄 Groq JSON validation error - this batch will be skipped and retried later`
          );
          console.log(
            `📝 Error details: ${error.message.substring(0, 200)}...`
          );
        }

        // Continue with next batch even if this one fails
        // Don't increment cycleProcessed for failed batches
      }

      // Update offset for next batch to prevent overlap
      currentOffset =
        extendedBatch.nextOffset || currentOffset + messageIds.length;

      totalProcessed += cycleProcessed;
      const remaining = totalUnprocessed - totalProcessed;
      const progressPercent = Math.round(
        (totalProcessed / totalUnprocessed) * 100
      );

      console.log(
        `📊 Cycle ${cycleCount} completed: ${cycleProcessed} messages processed`
      );
      console.log(
        `📊 Progress: ${totalProcessed}/${totalUnprocessed} (${progressPercent}%) - ${remaining} remaining`
      );
      console.log(`📊 Next offset: ${currentOffset}`);

      // Small delay between cycles to avoid overwhelming the system
      if (!isShuttingDown) {
        console.log('⏳ Waiting 2 seconds before next cycle...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (isShuttingDown) {
      console.log(`🛑 Processing stopped due to shutdown signal`);
      // Status will be updated by the shutdown handler
    } else {
      console.log(`✅ Completed processing all available messages`);

      // Mark parsing as completed
      if (progressService) {
        await progressService.updateProgress({
          status: 'completed',
          messagesRead: totalProcessed,
          productsCreated: totalProductsCreated, // Use the actual cumulative total
        });
      }
    }

    console.log(`🎉 Groq Sequential Processing completed!`);
    console.log(`📊 Total cycles: ${cycleCount}`);
    console.log(
      `📊 Total messages processed: ${totalProcessed}/${totalUnprocessed} (${Math.round((totalProcessed / totalUnprocessed) * 100)}%)`
    );
    console.log(`📊 Total products created: ${totalProductsCreated}`);
  } catch (error) {
    console.error('❌ Error in Groq Sequential Processing:', error);

    // Mark parsing as failed
    if (progressService) {
      try {
        await progressService.updateProgress({
          status: 'failed',
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
          messagesRead: totalProcessed,
          productsCreated: totalProductsCreated,
        });
      } catch (progressError) {
        console.error('❌ Failed to update parsing progress:', progressError);
      }
    }

    throw error;
  } finally {
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
