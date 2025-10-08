#!/usr/bin/env tsx

import { config } from 'dotenv';
// Load .env first (always), then allow .env.local to override if present
config({ path: '.env', override: false });
config({ path: '.env.local', override: true });

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const LOGS = path.join(ROOT, 'logs');
if (!fs.existsSync(LOGS)) fs.mkdirSync(LOGS, { recursive: true });

function run(command: string, args: string[], logFile: string) {
  const out = fs.createWriteStream(path.join(LOGS, logFile), { flags: 'a' });
  const child = spawn(command, args, {
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
    cwd: ROOT,
  });
  const prefix = `[${new Date().toISOString()}] $ ${command} ${args.join(' ')}\n`;
  out.write(prefix);
  child.stdout.pipe(out);
  child.stderr.pipe(out);
  child.on('close', code => {
    out.write(`[${new Date().toISOString()}] exited ${code}\n`);
  });
}

function scheduleEvery(ms: number, label: string, fn: () => void) {
  fn(); // run immediately on start
  setInterval(() => {
    console.log(
      `[local-cron] Trigger: ${label} at ${new Date().toISOString()}`
    );
    fn();
  }, ms);
}

const HOURLY_MIN = parseInt(process.env.CRON_HOURLY_MINUTES || '60', 10);
const POLL_MIN = parseInt(process.env.CRON_POLL_MINUTES || '5', 10);

// Hourly parser (advisory lock prevents overlaps)
scheduleEvery(HOURLY_MIN * 60 * 1000, 'hourly-cron', () => {
  const script = path.join(ROOT, 'src/scripts/hourly-cron.ts');
  run('./node_modules/.bin/tsx', [script], 'parsing-cron.log');
});

// Batch poller every N minutes
scheduleEvery(POLL_MIN * 60 * 1000, 'batch-poll', () => {
  const script = path.join(ROOT, 'src/scripts/batch-poll-v2.ts');
  run('./node_modules/.bin/tsx', [script], 'batch-poll.log');
});

console.log(
  `[local-cron] Started. hourly=${HOURLY_MIN}m, poll=${POLL_MIN}m. Logs in ./logs`
);

process.on('SIGINT', () => {
  console.log('\n[local-cron] Stopping...');
  process.exit(0);
});
