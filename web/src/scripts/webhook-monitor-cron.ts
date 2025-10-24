#!/usr/bin/env tsx

/**
 * Webhook Monitor Cron Job
 * Runs webhook status monitoring and sends notifications when needed
 */

import './load-env';
import { WebhookStatusMonitor } from './webhook-status-monitor';

async function main() {
  console.log('🚀 Starting Webhook Monitor Cron Job...');

  try {
    const monitor = new WebhookStatusMonitor();
    await monitor.monitor();
    console.log('✅ Webhook Monitor Cron Job completed successfully');
  } catch (error) {
    console.error('❌ Webhook Monitor Cron Job failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
