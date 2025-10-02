#!/usr/bin/env tsx

// Load environment variables from .env.local BEFORE any other imports
import './load-env';

import { spawn } from 'node:child_process';

import { prisma } from '../lib/db-node';

async function run(command: string, args: string[] = []) {
  console.log(`$ ${command} ${args.join(' ')}`);

  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      env: process.env,
      stdio: 'inherit', // This will show logs in real-time
    });

    child.on('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', error => {
      reject(error);
    });
  });
}

async function runNonBlocking(command: string, args: string[] = []) {
  console.log(`$ ${command} ${args.join(' ')} (non-blocking)`);

  const child = spawn(command, args, {
    env: process.env,
    stdio: 'inherit',
    detached: true, // Allow the process to continue after parent exits
  });

  // Unref the child process so it doesn't keep the parent alive
  child.unref();

  return child;
}

async function runWithTimeout(
  command: string,
  args: string[] = [],
  timeoutMs: number = 30 * 60 * 1000,
  extraEnv: Record<string, string> = {}
) {
  console.log(
    `$ ${command} ${args.join(' ')} (with ${timeoutMs / 1000}s timeout)`
  );

  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      env: { ...process.env, ...extraEnv },
      stdio: 'inherit',
    });

    // Set up timeout
    const timeout = setTimeout(() => {
      console.log(`Process timed out after ${timeoutMs / 1000}s, killing...`);
      child.kill('SIGTERM');
      reject(new Error(`Process timed out after ${timeoutMs / 1000}s`));
    }, timeoutMs);

    child.on('close', code => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', error => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function cleanupStuckProcesses() {
  // Clean up any parsing processes that have been running for more than 2 hours
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const stuckRecords = await prisma.parsingHistory.findMany({
    where: {
      status: 'running',
      startedAt: { lt: twoHoursAgo },
    },
  });

  if (stuckRecords.length > 0) {
    console.log(
      `[cron] Found ${stuckRecords.length} stuck parsing processes, cleaning up...`
    );

    for (const record of stuckRecords) {
      await prisma.parsingHistory.update({
        where: { id: record.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
          errorMessage:
            'Process timeout - marked as failed due to stuck status',
          duration: Math.floor(
            (Date.now() - record.startedAt.getTime()) / 1000
          ),
        },
      });
    }
  }
}

async function main() {
  const startTime = new Date();
  let parsingHistoryId: string | null = null;

  try {
    console.log(`[cron] Starting hourly job at ${startTime.toISOString()}`);

    // Clean up any stuck processes first
    await cleanupStuckProcesses();

    // Create parsing history record
    const parsingHistory = await prisma.parsingHistory.create({
      data: {
        startedAt: startTime,
        status: 'running',
        messagesRead: 0,
        productsCreated: 0,
      },
    });
    parsingHistoryId = parsingHistory.id;

    // Check how many parsers are currently running (for logging purposes)
    const runningParsers = await prisma.parsingHistory.count({
      where: {
        status: 'running',
        id: { not: parsingHistoryId },
      },
    });

    if (runningParsers > 0) {
      console.log(
        `[cron] Found ${runningParsers} running parsers, continuing with parallel execution`
      );
    }

    // Get initial counts
    const initialMessageCount = await prisma.whatsAppMessage.count({
      where: { processed: false },
    });
    const initialProductCount = await prisma.waDraftProduct.count();

    // 1) Fetch recent WhatsApp messages into DB (with timeout)
    console.log('[cron] Starting message fetching...');
    await runWithTimeout(
      'tsx',
      ['src/scripts/fetch-recent-messages.ts'],
      15 * 60 * 1000,
      { PARSING_HISTORY_ID: parsingHistoryId }
    ); // 15 minute timeout for fetching

    // 2) Convert messages to draft products (with timeout)
    console.log('[cron] Starting product processing...');
    await runWithTimeout(
      'tsx',
      ['src/scripts/process-draft-products-unified.ts'],
      30 * 60 * 1000,
      { PARSING_HISTORY_ID: parsingHistoryId }
    ); // 30 minute timeout for processing

    // Get final counts
    const finalMessageCount = await prisma.whatsAppMessage.count({
      where: { processed: false },
    });
    const finalProductCount = await prisma.waDraftProduct.count();

    const messagesRead = initialMessageCount - finalMessageCount;
    const productsCreated = finalProductCount - initialProductCount;
    const completedAt = new Date();
    const duration = Math.floor(
      (completedAt.getTime() - startTime.getTime()) / 1000
    );

    // Update parsing history with results
    await prisma.parsingHistory.update({
      where: { id: parsingHistoryId },
      data: {
        status: 'completed',
        completedAt,
        messagesRead,
        productsCreated,
        duration,
      },
    });

    console.log(`[cron] Completed hourly job at ${completedAt.toISOString()}`);
    console.log(
      `[cron] Messages read: ${messagesRead}, Products created: ${productsCreated}, Duration: ${duration}s`
    );
  } catch (error) {
    console.error('[cron] Hourly job failed:', error);

    if (parsingHistoryId) {
      const completedAt = new Date();
      const duration = Math.floor(
        (completedAt.getTime() - startTime.getTime()) / 1000
      );

      await prisma.parsingHistory.update({
        where: { id: parsingHistoryId },
        data: {
          status: 'failed',
          completedAt,
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
          duration,
        },
      });
    }

    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
