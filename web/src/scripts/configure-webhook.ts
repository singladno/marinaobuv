#!/usr/bin/env tsx

/**
 * Configure Green API webhook to receive messages in real-time
 */

import './load-env';
import { env } from '../lib/env';

async function configureWebhook() {
  const instanceId = env.GREEN_API_INSTANCE_ID;
  const token = env.GREEN_API_TOKEN;
  const webhookUrl = 'https://www.marina-obuv.ru/api/webhooks/green-api';

  if (!instanceId || !token) {
    console.error('❌ Green API credentials not configured!');
    console.log(
      'Please set GREEN_API_INSTANCE_ID and GREEN_API_TOKEN environment variables'
    );
    process.exit(1);
  }

  console.log('🔧 Configuring Green API webhook...');
  console.log(`🎯 Webhook URL: ${webhookUrl}`);
  console.log(`🔧 Instance ID: ${instanceId}`);
  console.log(`🎯 Target Group: ${env.TARGET_GROUP_ID}`);

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
    console.log('✅ Webhook configured successfully!');
    console.log('🔔 Green API will now send webhooks to your server');
    console.log('📋 Test by sending a message to your WhatsApp group');
    console.log(
      `🎯 Only messages from group ${env.TARGET_GROUP_ID} will be processed`
    );
  } else {
    console.error('❌ Failed to configure webhook:', result);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  configureWebhook().catch(console.error);
}
