#!/usr/bin/env tsx

// Load environment variables from .env.local BEFORE any other imports
import './load-env';

import { prisma } from '../lib/db-node';

/**
 * Script to update parsing status manually
 * Usage: tsx src/scripts/update-parsing-status.ts <parsingHistoryId> <status> [errorMessage]
 *
 * Examples:
 * - tsx src/scripts/update-parsing-status.ts abc123 failed "Process was cancelled"
 * - tsx src/scripts/update-parsing-status.ts abc123 completed
 */

async function updateParsingStatus(
  parsingHistoryId: string,
  status: 'running' | 'completed' | 'failed',
  errorMessage?: string
) {
  try {
    console.log(
      `🔄 Updating parsing status for ${parsingHistoryId} to ${status}...`
    );

    const updateData: any = {
      status,
    };

    if (status === 'completed' || status === 'failed') {
      updateData.completedAt = new Date();

      // Calculate duration
      const record = await prisma.parsingHistory.findUnique({
        where: { id: parsingHistoryId },
        select: { startedAt: true },
      });

      if (record) {
        const duration = Math.floor(
          (Date.now() - record.startedAt.getTime()) / 1000
        );
        updateData.duration = duration;
      }
    }

    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    }

    const updatedRecord = await prisma.parsingHistory.update({
      where: { id: parsingHistoryId },
      data: updateData,
    });

    console.log('✅ Parsing status updated successfully:');
    console.log(`  - Status: ${updatedRecord.status}`);
    console.log(`  - Messages Read: ${updatedRecord.messagesRead}`);
    console.log(`  - Products Created: ${updatedRecord.productsCreated}`);
    if (updatedRecord.completedAt) {
      console.log(
        `  - Completed At: ${updatedRecord.completedAt.toISOString()}`
      );
    }
    if (updatedRecord.duration) {
      console.log(`  - Duration: ${updatedRecord.duration}s`);
    }
    if (updatedRecord.errorMessage) {
      console.log(`  - Error: ${updatedRecord.errorMessage}`);
    }
  } catch (error) {
    console.error('❌ Error updating parsing status:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error(
      '❌ Usage: tsx src/scripts/update-parsing-status.ts <parsingHistoryId> <status> [errorMessage]'
    );
    console.error('   Status options: running, completed, failed');
    process.exit(1);
  }

  const [parsingHistoryId, status, errorMessage] = args;

  if (!['running', 'completed', 'failed'].includes(status)) {
    console.error(
      '❌ Invalid status. Must be one of: running, completed, failed'
    );
    process.exit(1);
  }

  await updateParsingStatus(parsingHistoryId, status as any, errorMessage);
}

main().catch(console.error);
