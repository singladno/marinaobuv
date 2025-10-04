#!/usr/bin/env tsx

// Load environment variables from .env.local FIRST
import { config } from 'dotenv';
config({ path: '.env.local', override: true });

import { prisma } from '../lib/db-node';

/**
 * Health check script for parsing processes
 * This script should be run periodically (e.g., every 5 minutes) to:
 * 1. Detect stuck parsing processes
 * 2. Clean up old stuck processes
 * 3. Monitor system health
 * 4. Send alerts if needed
 */

interface HealthCheckResult {
  stuckProcesses: number;
  oldProcesses: number;
  totalRunning: number;
  cleanedUp: number;
  alerts: string[];
}

async function performHealthCheck(): Promise<HealthCheckResult> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  const alerts: string[] = [];
  let cleanedUp = 0;

  // 1. Find all running processes
  const runningProcesses = await prisma.parsingHistory.findMany({
    where: { status: 'running' },
    orderBy: { startedAt: 'desc' },
  });

  // 2. Find stuck processes (running for more than 1 hour)
  const stuckProcesses = runningProcesses.filter(p => p.startedAt < oneHourAgo);

  // 3. Find very old processes (running for more than 2 hours)
  const oldProcesses = runningProcesses.filter(p => p.startedAt < twoHoursAgo);

  // 4. Clean up old processes
  if (oldProcesses.length > 0) {
    console.log(`🧹 Cleaning up ${oldProcesses.length} very old processes...`);

    for (const process of oldProcesses) {
      const duration = Math.floor(
        (now.getTime() - process.startedAt.getTime()) / 1000
      );

      await prisma.parsingHistory.update({
        where: { id: process.id },
        data: {
          status: 'failed',
          completedAt: now,
          errorMessage:
            'Process timeout - automatically cleaned up by health check',
          duration,
        },
      });

      cleanedUp++;
    }
  }

  // 5. Generate alerts
  if (stuckProcesses.length > 0) {
    alerts.push(
      `⚠️ ${stuckProcesses.length} parsing processes stuck for >1 hour`
    );
  }

  if (runningProcesses.length > 3) {
    alerts.push(
      `⚠️ ${runningProcesses.length} parsing processes running simultaneously`
    );
  }

  if (oldProcesses.length > 0) {
    alerts.push(`🧹 Cleaned up ${oldProcesses.length} very old processes`);
  }

  return {
    stuckProcesses: stuckProcesses.length,
    oldProcesses: oldProcesses.length,
    totalRunning: runningProcesses.length,
    cleanedUp,
    alerts,
  };
}

async function main() {
  try {
    console.log('🏥 Starting parsing health check...');

    const result = await performHealthCheck();

    console.log('\n📊 Health Check Results:');
    console.log(`  Total running processes: ${result.totalRunning}`);
    console.log(`  Stuck processes (>1h): ${result.stuckProcesses}`);
    console.log(`  Very old processes (>2h): ${result.oldProcesses}`);
    console.log(`  Cleaned up: ${result.cleanedUp}`);

    if (result.alerts.length > 0) {
      console.log('\n🚨 Alerts:');
      result.alerts.forEach(alert => console.log(`  ${alert}`));
    } else {
      console.log('\n✅ All systems healthy');
    }

    // Exit with error code if there are issues
    if (result.stuckProcesses > 0 || result.totalRunning > 3) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('❌ Health check failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the health check
main().catch(console.error);
