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

async function main() {
  try {
    console.log(`[cron] Starting hourly job at ${new Date().toISOString()}`);

    // 1) Fetch recent WhatsApp messages into DB
    await run('tsx', ['src/scripts/fetch-recent-messages.ts']);

    // 2) Convert messages to draft products
    await run('tsx', ['src/scripts/process-draft-products.ts']);

    console.log(`[cron] Completed hourly job at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('[cron] Hourly job failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
