#!/usr/bin/env tsx

// Load environment variables from .env BEFORE any other imports
import './load-env';

import { prisma } from '../lib/db-node';

/**
 * Parse Status Script
 * Shows current parsing status and health
 */
async function main() {
  try {
    console.log('📊 Parsing Status Check');
    console.log('======================');

    // Get current parsing history
    const currentParsing = await prisma.parsingHistory.findFirst({
      where: {
        status: {
          in: ['running', 'pending'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (currentParsing) {
      console.log(`\n🔄 Current Parsing Session:`);
      console.log(`  - ID: ${currentParsing.id}`);
      console.log(
        `  - Triggered by: ${currentParsing.triggeredBy || 'unknown'}`
      );
      console.log(`  - Status: ${currentParsing.status}`);
      console.log(`  - Started: ${currentParsing.createdAt.toISOString()}`);
      console.log(`  - Reason: ${currentParsing.reason}`);

      if (currentParsing.status === 'running') {
        const duration = Math.floor(
          (Date.now() - currentParsing.createdAt.getTime()) / 1000
        );
        console.log(`  - Duration: ${duration}s`);
      }
    } else {
      console.log(`\n✅ No active parsing sessions`);
    }

    // Get recent parsing history
    const recentParsing = await prisma.parsingHistory.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (recentParsing.length > 0) {
      console.log(`\n📈 Recent Parsing History:`);
      recentParsing.forEach((session, index) => {
        const duration = session.completedAt
          ? Math.floor(
              (session.completedAt.getTime() - session.createdAt.getTime()) /
                1000
            )
          : 'ongoing';
        console.log(
          `  ${index + 1}. ${session.triggeredBy || 'unknown'} - ${session.status} (${duration}s) - ${session.createdAt.toISOString()}`
        );
      });
    }

    // Get message counts
    const totalMessages = await prisma.whatsAppMessage.count();
    const unprocessedMessages = await prisma.whatsAppMessage.count({
      where: { processed: false },
    });
    const processedMessages = totalMessages - unprocessedMessages;

    console.log(`\n📨 Message Statistics:`);
    console.log(`  - Total messages: ${totalMessages}`);
    console.log(`  - Processed: ${processedMessages}`);
    console.log(`  - Unprocessed: ${unprocessedMessages}`);

    // Get product counts
    const totalProducts = await prisma.product.count();
    const activeProducts = await prisma.product.count({
      where: { isActive: true },
    });

    console.log(`\n🛍️ Product Statistics:`);
    console.log(`  - Total products: ${totalProducts}`);
    console.log(`  - Active products: ${activeProducts}`);

    console.log(`\n✅ Status check completed`);
  } catch (error) {
    console.error('❌ Status check failed:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Fatal error in status check:', error);
  process.exit(1);
});
