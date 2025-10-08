#!/usr/bin/env tsx

/**
 * Test webhook endpoint to verify it's working
 */

import './load-env';
import { env } from '../lib/env';

async function testWebhook() {
  const webhookUrl = 'https://www.marina-obuv.ru/api/webhooks/green-api';

  console.log('🧪 Testing webhook endpoint...');
  console.log(`🎯 Webhook URL: ${webhookUrl}`);

  try {
    const response = await fetch(webhookUrl, {
      method: 'GET',
    });

    const result = await response.json();
    console.log('✅ Webhook endpoint is active:');
    console.log(JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('🎉 Webhook is ready to receive messages!');
      console.log(`🎯 Target group: ${env.TARGET_GROUP_ID}`);
      console.log('📋 Send a test message to your WhatsApp group to verify');
    }
  } catch (error) {
    console.error('❌ Webhook test failed:', error);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testWebhook().catch(console.error);
}
