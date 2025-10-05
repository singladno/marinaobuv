#!/usr/bin/env tsx

// Load environment variables from .env BEFORE any other imports
import './load-env';

import { prisma } from '../lib/db-node';

/**
 * Clean up stuck parsing processes
 * This script can be run manually or via cron to clean up any parsing processes
 * that have been stuck in "running" status for too long
 */
async function cleanupStuckParsing() {
  try {
    console.log('🧹 Starting cleanup of stuck parsing processes...');

    // Find parsing processes that have been running for more than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const stuckRecords = await prisma.parsingHistory.findMany({
      where: {
        status: 'running',
        startedAt: { lt: oneHourAgo },
      },
      orderBy: { startedAt: 'desc' },
    });

    if (stuckRecords.length === 0) {
      console.log('✅ No stuck parsing processes found');
      return;
    }

    console.log(`🔍 Found ${stuckRecords.length} stuck parsing processes:`);

    for (const record of stuckRecords) {
      const duration = Math.floor(
        (Date.now() - record.startedAt.getTime()) / 1000
      );
      const durationMinutes = Math.floor(duration / 60);
      console.log(
        `  - ID: ${record.id}, Started: ${record.startedAt}, Duration: ${durationMinutes}m`
      );
    }

    console.log('\n🔧 Cleaning up stuck processes...');

    for (const record of stuckRecords) {
      const now = new Date();
      const duration = Math.floor(
        (now.getTime() - record.startedAt.getTime()) / 1000
      );

      await prisma.parsingHistory.upsert({
        where: { id: record.id },
        update: {
          status: 'failed',
          completedAt: now,
          errorMessage:
            'Process timeout - marked as failed due to stuck status',
          duration: duration,
        },
        create: {
          id: record.id,
          status: 'failed',
          completedAt: now,
          errorMessage:
            'Process timeout - marked as failed due to stuck status',
          duration: duration,
        },
      });

      console.log(`  ✅ Fixed: ${record.id}`);
    }

    console.log(
      `\n🎉 Successfully cleaned up ${stuckRecords.length} stuck parsing processes`
    );

    // Show current status
    const runningCount = await prisma.parsingHistory.count({
      where: { status: 'running' },
    });

    console.log(`📊 Current running parsers: ${runningCount}`);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupStuckParsing();
