#!/usr/bin/env tsx

// Load environment variables from .env.local BEFORE any other imports
import './load-env';

import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';

import { prisma } from '../lib/db-node';

const exec = promisify(execCb);

async function run(command: string) {
  console.log(`$ ${command}`);
  const { stdout, stderr } = await exec(command, { env: process.env });
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
}

async function main() {
  try {
    console.log(`[cron] Starting hourly job at ${new Date().toISOString()}`);

    // 1) Fetch recent WhatsApp messages into DB
    await run('tsx src/scripts/fetch-recent-messages.ts');

    // 2) Convert messages to draft products
    await run('tsx src/scripts/process-draft-products.ts');

    console.log(`[cron] Completed hourly job at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('[cron] Hourly job failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
