#!/usr/bin/env tsx

/**
 * Configure Green API webhook for LOCAL development
 * Uses ngrok or local tunnel to expose local server
 */

import './load-env';
import { env } from '../lib/env';

async function configureWebhookLocal() {
  const instanceId = env.GREEN_API_INSTANCE_ID;
  const token = env.GREEN_API_TOKEN;

  // You need to replace this with your actual ngrok URL or local tunnel URL
  const webhookUrl =
    process.env.LOCAL_WEBHOOK_URL ||
    'http://localhost:3000/api/webhooks/green-api';

  if (!instanceId || !token) {
    console.error('❌ Green API credentials not configured!');
    console.log(
      'Please set GREEN_API_INSTANCE_ID and GREEN_API_TOKEN environment variables'
    );
    process.exit(1);
  }

  console.log('🔧 Configuring Green API webhook for LOCAL development...');
  console.log(`🎯 Webhook URL: ${webhookUrl}`);
  console.log(`🔧 Instance ID: ${instanceId}`);
  console.log(`🎯 Target Group: ${env.TARGET_GROUP_ID}`);

  console.log('\n⚠️  IMPORTANT: For local development, you need to:');
  console.log('1. Use ngrok or similar tool to expose your local server');
  console.log('2. Update LOCAL_WEBHOOK_URL environment variable');
  console.log('3. Make sure your local server is running on port 3000');

  if (webhookUrl.includes('localhost') || webhookUrl.includes('127.0.0.1')) {
    console.log('\n❌ Cannot use localhost URL for webhook!');
    console.log(
      'Please use ngrok or similar service to expose your local server.'
    );
    console.log('Example: ngrok http 3000');
    return;
  }

  const settingsPayload = {
    incomingWebhook: webhookUrl,
    incomingWebhookOnAnswer: webhookUrl,
    outgoingWebhook: webhookUrl,
    outgoingMessageWebhook: webhookUrl,
    stateWebhook: webhookUrl,
    deviceWebhook: webhookUrl,
  };

  const postData = JSON.stringify(settingsPayload);

  const response = await fetch(
    `https://api.green-api.com/waInstance${instanceId}/setSettings/${token}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: postData,
    }
  );

  const result = await response.json();

  if (result.saveSettings === true) {
    console.log('✅ Local webhook configured successfully!');
    console.log('🔔 Green API will now send webhooks to your local server');
    console.log('📋 Test by sending a message to your WhatsApp group');
    console.log(
      `🎯 Only messages from group ${env.TARGET_GROUP_ID} will be processed`
    );
  } else {
    console.error('❌ Failed to configure local webhook:', result);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  configureWebhookLocal().catch(console.error);
}
