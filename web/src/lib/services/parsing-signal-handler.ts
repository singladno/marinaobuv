/**
 * Signal handler for parsing processes
 * Ensures proper cleanup and status updates when processes are cancelled or interrupted
 */

import { ParsingProgressService } from './parsing-progress-service';
import { logger, logServerError } from '@/lib/server/logger';

let parsingProgressService: ParsingProgressService | null = null;
let isShuttingDown = false;

/**
 * Initialize signal handlers for parsing processes
 */
export function initializeParsingSignalHandlers(
  service: ParsingProgressService
) {
  parsingProgressService = service;

  // Handle SIGTERM (termination signal)
  process.on('SIGTERM', handleShutdown);

  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', handleShutdown);

  // Handle uncaught exceptions
  process.on('uncaughtException', handleUncaughtException);

  // Handle unhandled promise rejections
  process.on('unhandledRejection', handleUnhandledRejection);

  logger.debug('🛡️ Signal handlers initialized for parsing process');
}

/**
 * Handle shutdown signals
 */
async function handleShutdown(signal: string) {
  if (isShuttingDown) {
    logger.debug('⚠️ Already shutting down, ignoring signal');
    return;
  }

  isShuttingDown = true;
  logger.debug(`\n🛑 Received ${signal}, shutting down gracefully...`);

  if (parsingProgressService) {
    try {
      // Check if this is a timeout scenario (SIGTERM from timeout)
      if (signal === 'SIGTERM') {
        // Try to get current progress to mark as partial completion
        const progress = await parsingProgressService.getProgress();
        if (progress && progress.messagesRead > 0) {
          await parsingProgressService.markPartialCompletion(
            progress.messagesRead,
            progress.productsCreated || 0,
            `Process terminated by ${signal} signal - partial completion`
          );
          logger.debug('📊 Parsing status updated to partial completion');
        } else {
          await parsingProgressService.markFailed(
            `Process terminated by ${signal} signal`
          );
          logger.debug('📊 Parsing status updated to failed');
        }
      } else {
        await parsingProgressService.markFailed(
          `Process terminated by ${signal} signal`
        );
        logger.debug('📊 Parsing status updated to failed');
      }
    } catch (error) {
      logServerError('❌ Error updating parsing status:', error);
    }
  }

  logger.debug('👋 Shutdown complete');
  process.exit(0);
}

/**
 * Handle uncaught exceptions
 */
async function handleUncaughtException(error: Error) {
  logServerError('💥 Uncaught Exception:', error);

  if (parsingProgressService && !isShuttingDown) {
    try {
      await parsingProgressService.markFailed(
        `Uncaught exception: ${error.message}`
      );
    } catch (updateError) {
      logServerError('Error updating parsing status after uncaught exception', updateError);
    }
  }

  process.exit(1);
}

/**
 * Handle unhandled promise rejections
 */
async function handleUnhandledRejection(reason: any, promise: Promise<any>) {
  logServerError('Unhandled promise rejection', reason);

  if (parsingProgressService && !isShuttingDown) {
    try {
      await parsingProgressService.markFailed(
        `Unhandled promise rejection: ${reason}`
      );
    } catch (updateError) {
      logServerError('Error updating parsing status after unhandled rejection', updateError);
    }
  }

  process.exit(1);
}

/**
 * Clean up signal handlers
 */
export function cleanupSignalHandlers() {
  process.removeAllListeners('SIGTERM');
  process.removeAllListeners('SIGINT');
  process.removeAllListeners('uncaughtException');
  process.removeAllListeners('unhandledRejection');
  logger.debug('🧹 Signal handlers cleaned up');
}
