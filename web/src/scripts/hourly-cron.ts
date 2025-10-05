#!/usr/bin/env tsx

// Load environment variables from .env BEFORE any other imports
import './load-env';

import { spawn } from 'node:child_process';

import { prisma } from '../lib/db-node';

async function run(
  command: string,
  args: string[] = [],
  extraEnv: Record<string, string> = {}
) {
  console.log(`$ ${command} ${args.join(' ')}`);

  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      env: { ...process.env, ...extraEnv },
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

async function runWithGracefulTimeout(
  command: string,
  args: string[] = [],
  timeoutMs: number = 30 * 60 * 1000,
  extraEnv: Record<string, string> = {}
) {
  console.log(
    `$ ${command} ${args.join(' ')} (with ${timeoutMs / 1000}s graceful timeout)`
  );

  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      env: { ...process.env, ...extraEnv },
      stdio: 'inherit',
    });

    let isResolved = false;
    let timeoutTriggered = false;

    // Set up timeout
    const timeout = setTimeout(() => {
      if (!isResolved) {
        timeoutTriggered = true;
        console.log(
          `Process approaching timeout after ${timeoutMs / 1000}s, sending graceful shutdown signal...`
        );
        // Send SIGTERM for graceful shutdown instead of SIGKILL
        child.kill('SIGTERM');

        // Give the process time to clean up gracefully
        setTimeout(() => {
          if (!isResolved) {
            console.log(
              'Process did not shut down gracefully, forcing termination...'
            );
            child.kill('SIGKILL');
            reject(new Error(`Process timed out after ${timeoutMs / 1000}s`));
          }
        }, 30000); // 30 seconds grace period
      }
    }, timeoutMs);

    child.on('close', code => {
      if (!isResolved) {
        clearTimeout(timeout);
        isResolved = true;

        if (timeoutTriggered) {
          console.log(
            `Process completed with exit code ${code} after timeout signal`
          );
          // Don't reject on timeout - allow partial completion
          resolve();
        } else if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      }
    });

    child.on('error', error => {
      if (!isResolved) {
        clearTimeout(timeout);
        isResolved = true;
        reject(error);
      }
    });
  });
}

async function cleanupStuckProcesses() {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  // Find processes stuck for more than 1 hour (warning)
  const stuckRecords = await prisma.parsingHistory.findMany({
    where: {
      status: 'running',
      startedAt: { lt: oneHourAgo },
    },
  });

  // Find processes stuck for more than 2 hours (cleanup)
  const veryOldRecords = await prisma.parsingHistory.findMany({
    where: {
      status: 'running',
      startedAt: { lt: twoHoursAgo },
    },
  });

  if (stuckRecords.length > 0) {
    console.log(
      `[cron] Found ${stuckRecords.length} stuck parsing processes (>1h), cleaning up...`
    );

    for (const record of stuckRecords) {
      const duration = Math.floor(
        (now.getTime() - record.startedAt.getTime()) / 1000
      );
      const isVeryOld = record.startedAt < twoHoursAgo;

      await prisma.parsingHistory.upsert({
        where: { id: record.id },
        update: {
          status: 'failed',
          completedAt: now,
          errorMessage: isVeryOld
            ? 'Process timeout - automatically cleaned up (>2h)'
            : 'Process timeout - marked as failed due to stuck status (>1h)',
          duration,
        },
        create: {
          id: record.id,
          status: 'failed',
          completedAt: now,
          errorMessage: isVeryOld
            ? 'Process timeout - automatically cleaned up (>2h)'
            : 'Process timeout - marked as failed due to stuck status (>1h)',
          duration,
        },
      });
    }
  }

  // Additional safety check: if too many processes are running, clean up oldest ones
  const totalRunning = await prisma.parsingHistory.count({
    where: { status: 'running' },
  });

  if (totalRunning > 5) {
    console.log(
      `[cron] Warning: ${totalRunning} processes running simultaneously`
    );

    // Clean up oldest running processes (keep only 3 most recent)
    const oldestRunning = await prisma.parsingHistory.findMany({
      where: { status: 'running' },
      orderBy: { startedAt: 'asc' },
      take: totalRunning - 3,
    });

    for (const record of oldestRunning) {
      const duration = Math.floor(
        (now.getTime() - record.startedAt.getTime()) / 1000
      );

      await prisma.parsingHistory.upsert({
        where: { id: record.id },
        update: {
          status: 'failed',
          completedAt: now,
          errorMessage: 'Process terminated - too many concurrent processes',
          duration,
        },
        create: {
          id: record.id,
          status: 'failed',
          completedAt: now,
          errorMessage: 'Process terminated - too many concurrent processes',
          duration,
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
    const initialProductCount = await prisma.product.count();

    // 1) Fetch recent WhatsApp messages into DB using optimized Green API (with timeout)
    console.log('[cron] Starting message fetching with optimized Green API...');
    await runWithTimeout(
      'tsx',
      ['src/scripts/fetch-messages-green-api-optimized.ts'],
      5 * 60 * 1000,
      { PARSING_HISTORY_ID: parsingHistoryId }
    ); // 5 minute timeout for fetching (much faster now!)

    // 2) Convert messages to draft products (with graceful timeout)
    console.log('[cron] Starting product processing...');
    // IMPORTANT: Never terminate the parser mid-run; let it complete all messages
    await run('tsx', ['src/scripts/process-draft-products-unified.ts'], {
      PARSING_HISTORY_ID: parsingHistoryId,
    });
    console.log('[cron] Processing completed successfully');

    // Get final counts
    const finalMessageCount = await prisma.whatsAppMessage.count({
      where: { processed: false },
    });
    const finalProductCount = await prisma.product.count();

    const messagesRead = initialMessageCount - finalMessageCount;
    const productsCreated = finalProductCount - initialProductCount;
    const completedAt = new Date();
    const duration = Math.floor(
      (completedAt.getTime() - startTime.getTime()) / 1000
    );

    // Update parsing history with results
    // Check if the processing was marked as partial completion
    const currentHistory = await prisma.parsingHistory.findUnique({
      where: { id: parsingHistoryId },
    });

    const finalStatus =
      currentHistory?.status === 'completed' ? 'completed' : 'completed';
    const finalErrorMessage = currentHistory?.errorMessage || null;

    await prisma.parsingHistory.upsert({
      where: { id: parsingHistoryId },
      update: {
        status: finalStatus,
        completedAt,
        messagesRead,
        productsCreated,
        duration,
        errorMessage: finalErrorMessage,
      },
      create: {
        id: parsingHistoryId,
        startedAt: startTime,
        status: finalStatus,
        completedAt,
        messagesRead,
        productsCreated,
        duration,
        errorMessage: finalErrorMessage,
      },
    });

    console.log(`[cron] Completed hourly job at ${completedAt.toISOString()}`);
    console.log(
      `[cron] Messages read: ${messagesRead}, Products created: ${productsCreated}, Duration: ${duration}s`
    );

    if (finalErrorMessage) {
      console.log(
        `[cron] Note: Processing completed with warnings: ${finalErrorMessage}`
      );
    }
  } catch (error) {
    console.error('[cron] Hourly job failed:', error);

    if (parsingHistoryId) {
      const completedAt = new Date();
      const duration = Math.floor(
        (completedAt.getTime() - startTime.getTime()) / 1000
      );

      await prisma.parsingHistory.upsert({
        where: { id: parsingHistoryId },
        update: {
          status: 'failed',
          completedAt,
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
          duration,
        },
        create: {
          id: parsingHistoryId,
          startedAt: startTime,
          status: 'failed',
          completedAt,
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
          duration,
          messagesRead: 0,
          productsCreated: 0,
        },
      });
    }

    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
