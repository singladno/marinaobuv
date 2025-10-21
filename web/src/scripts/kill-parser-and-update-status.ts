#!/usr/bin/env tsx

/**
 * Script to kill parser processes and update database status
 * This script is called by the server:parser:kill command
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function killParserAndUpdateStatus() {
  try {
    console.log('🛑 Killing parser processes and updating database status...');

    // Find all running parsing processes
    const runningParsers = await prisma.parsingHistory.findMany({
      where: { status: 'running' },
      orderBy: { startedAt: 'desc' },
    });

    if (runningParsers.length === 0) {
      console.log('✅ No running parsers found in database');
      return;
    }

    console.log(
      `🔍 Found ${runningParsers.length} running parsers in database`
    );

    // Update all running parsers to failed status with kill message
    const now = new Date();
    const updatePromises = runningParsers.map(async parser => {
      const duration = Math.floor(
        (now.getTime() - parser.startedAt.getTime()) / 1000
      );

      return prisma.parsingHistory.update({
        where: { id: parser.id },
        data: {
          status: 'failed',
          completedAt: now,
          errorMessage: 'Parser killed by admin command',
          duration: duration,
        },
      });
    });

    await Promise.all(updatePromises);

    console.log(
      `✅ Successfully updated ${runningParsers.length} parser records to failed status`
    );
  } catch (error) {
    console.error('❌ Error updating parser status:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
killParserAndUpdateStatus();
