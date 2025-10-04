#!/usr/bin/env tsx

// Load environment variables from .env.local FIRST
import { config } from 'dotenv';
config({ path: '.env.local', override: true });

import { spawn } from 'node:child_process';
import { prisma } from '../lib/db-node';

/**
 * Parsing Monitor Script
 * This script should be run every 5-10 minutes to monitor parsing health
 * and automatically clean up stuck processes
 */

async function runHealthCheck() {
  return new Promise<void>((resolve, reject) => {
    const child = spawn('npx', ['tsx', 'src/scripts/parsing-health-check.ts'], {
      stdio: 'inherit',
      env: process.env,
    });

    child.on('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Health check failed with exit code ${code}`));
      }
    });

    child.on('error', error => {
      reject(error);
    });
  });
}

async function getSystemStats() {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const stats = await prisma.parsingHistory.groupBy({
    by: ['status'],
    _count: { status: true },
    where: {
      startedAt: { gte: oneHourAgo },
    },
  });

  const totalRunning = await prisma.parsingHistory.count({
    where: { status: 'running' },
  });

  const stuckCount = await prisma.parsingHistory.count({
    where: {
      status: 'running',
      startedAt: { lt: oneHourAgo },
    },
  });

  return {
    stats,
    totalRunning,
    stuckCount,
    timestamp: now,
  };
}

async function main() {
  try {
    console.log('🔍 Starting parsing monitor...');

    // Get current system stats
    const stats = await getSystemStats();

    console.log('\n📊 System Status:');
    console.log(`  Total running processes: ${stats.totalRunning}`);
    console.log(`  Stuck processes (>1h): ${stats.stuckCount}`);

    if (stats.stats.length > 0) {
      console.log('\n📈 Recent Activity (last hour):');
      stats.stats.forEach(stat => {
        console.log(`  ${stat.status}: ${stat._count.status}`);
      });
    }

    // Run health check
    console.log('\n🏥 Running health check...');
    await runHealthCheck();

    console.log('\n✅ Monitor check complete');
  } catch (error) {
    console.error('❌ Monitor failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the monitor
main().catch(console.error);
