#!/usr/bin/env tsx

// Load environment variables from .env BEFORE any other imports
import './load-env';

import { ParsingCoordinator } from '../lib/services/parsing-coordinator';
import { runWithTimeout } from '../lib/run-with-timeout';

/**
 * Manual Parsing Script
 * Allows manual parsing with smart conflict resolution (NO FORCE OVERRIDE)
 */
async function main() {
  const args = process.argv.slice(2);
  const reason =
    args.find(arg => arg.startsWith('--reason='))?.split('=')[1] ||
    'Manual parsing request';

  console.log(`🔧 Manual parsing requested at ${new Date().toISOString()}`);
  console.log(`📝 Reason: ${reason}`);

  // Check if we can proceed
  const guardResult = await ParsingCoordinator.canStartParsing({
    type: 'manual',
    reason,
  });

  if (!guardResult.canProceed) {
    console.log(`❌ Cannot start manual parsing: ${guardResult.reason}`);

    if (
      guardResult.runningProcesses &&
      guardResult.runningProcesses.length > 0
    ) {
      console.log(`\n📊 Currently running processes:`);
      guardResult.runningProcesses.forEach(p => {
        console.log(`  - ${p.type} (${p.duration}s) - ID: ${p.id}`);
      });
      console.log(`\n💡 Options:`);
      console.log(`  - Wait for current process to complete`);
      console.log(`  - Check status: npm run server:parse-status`);
      console.log(`  - Monitor logs: npm run server:parser-logs`);
    }

    process.exit(1);
  }

  let parsingHistoryId: string | null = null;

  try {
    // Create parsing history record
    parsingHistoryId = await ParsingCoordinator.createParsingHistory(
      'manual',
      reason
    );
    console.log(`✅ Manual parsing started with ID: ${parsingHistoryId}`);

    // Get initial counts
    const { prisma } = await import('../lib/db-node');
    const initialMessageCount = await prisma.whatsAppMessage.count({
      where: { processed: false },
    });
    const initialProductCount = await prisma.product.count();

    console.log(
      `📊 Initial state: ${initialMessageCount} unprocessed messages, ${initialProductCount} products`
    );

    // 1) Fetch recent WhatsApp messages into DB using optimized Green API
    console.log(
      '[manual] Starting message fetching with optimized Green API...'
    );
    await runWithTimeout(
      'tsx',
      ['src/scripts/fetch-messages-green-api-optimized.ts'],
      5 * 60 * 1000, // 5 minute timeout
      { PARSING_HISTORY_ID: parsingHistoryId }
    );

    // 2) Convert messages to draft products
    console.log('[manual] Starting product processing...');
    await runWithTimeout(
      'tsx',
      ['src/scripts/process-draft-products-unified.ts'],
      30 * 60 * 1000, // 30 minute timeout
      { PARSING_HISTORY_ID: parsingHistoryId }
    );

    // 3) Convert draft products to final products
    console.log('[manual] Starting final product creation...');
    await runWithTimeout(
      'tsx',
      ['src/scripts/convert-drafts-to-products.ts'],
      10 * 60 * 1000, // 10 minute timeout
      { PARSING_HISTORY_ID: parsingHistoryId }
    );

    // Get final counts
    const finalMessageCount = await prisma.whatsAppMessage.count({
      where: { processed: false },
    });
    const finalProductCount = await prisma.product.count();

    const messagesProcessed = initialMessageCount - finalMessageCount;
    const productsCreated = finalProductCount - initialProductCount;

    console.log(`\n🎉 Manual parsing completed successfully!`);
    console.log(`📊 Results:`);
    console.log(`  - Messages processed: ${messagesProcessed}`);
    console.log(`  - Products created: ${productsCreated}`);
    console.log(`  - Remaining unprocessed: ${finalMessageCount}`);

    // Update parsing history
    if (parsingHistoryId) {
      await prisma.parsingHistory.update({
        where: { id: parsingHistoryId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          messagesRead: messagesProcessed,
          productsCreated: productsCreated,
        },
      });
    }
  } catch (error) {
    console.error('❌ Manual parsing failed:', error);

    // Update parsing history with error
    if (parsingHistoryId) {
      const { prisma } = await import('../lib/db-node');
      await prisma.parsingHistory.update({
        where: { id: parsingHistoryId },
        data: {
          status: 'failed',
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      });
    }

    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Manual parsing interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Manual parsing terminated');
  process.exit(0);
});

main().catch(error => {
  console.error('❌ Fatal error in manual parsing:', error);
  process.exit(1);
});
