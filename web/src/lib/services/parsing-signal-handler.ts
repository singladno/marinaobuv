/**
 * Signal handler for parsing processes
 * Ensures proper cleanup and status updates when processes are cancelled or interrupted
 */

import { ParsingProgressService } from './parsing-progress-service';

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

  console.log('🛡️ Signal handlers initialized for parsing process');
}

/**
 * Handle shutdown signals
 */
async function handleShutdown(signal: string) {
  if (isShuttingDown) {
    console.log('⚠️ Already shutting down, ignoring signal');
    return;
  }

  isShuttingDown = true;
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

  if (parsingProgressService) {
    try {
      await parsingProgressService.markFailed(
        `Process terminated by ${signal} signal`
      );
      console.log('📊 Parsing status updated to failed');
    } catch (error) {
      console.error('❌ Error updating parsing status:', error);
    }
  }

  console.log('👋 Shutdown complete');
  process.exit(0);
}

/**
 * Handle uncaught exceptions
 */
async function handleUncaughtException(error: Error) {
  console.error('💥 Uncaught Exception:', error);

  if (parsingProgressService && !isShuttingDown) {
    try {
      await parsingProgressService.markFailed(
        `Uncaught exception: ${error.message}`
      );
    } catch (updateError) {
      console.error('❌ Error updating parsing status:', updateError);
    }
  }

  process.exit(1);
}

/**
 * Handle unhandled promise rejections
 */
async function handleUnhandledRejection(reason: any, promise: Promise<any>) {
  console.error('💥 Unhandled Promise Rejection:', reason);

  if (parsingProgressService && !isShuttingDown) {
    try {
      await parsingProgressService.markFailed(
        `Unhandled promise rejection: ${reason}`
      );
    } catch (updateError) {
      console.error('❌ Error updating parsing status:', updateError);
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
  console.log('🧹 Signal handlers cleaned up');
}
