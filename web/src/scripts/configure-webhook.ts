#!/usr/bin/env tsx

/**
 * Configure Green API webhook to receive messages in real-time
 */

import './load-env';
import { env } from '../lib/env';
import { getGreenApiIncomingWebhookUrl } from '../lib/server/green-webhook-relay';

async function configureWebhook() {
  const instanceId = env.GREEN_API_INSTANCE_ID;
  const token = env.GREEN_API_TOKEN;
  /** Must match relay route — deploy runs this script and overwrites Green API; do not hardcode the non-relay path. */
  const webhookUrl = getGreenApiIncomingWebhookUrl();

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
    webhookUrl: webhookUrl,
    // CRITICAL: Enable incoming messages and files webhook
    incomingWebhook: 'yes',
    // Enable all message types
    outgoingWebhook: 'yes',
    stateWebhook: 'yes',
    outgoingMessageWebhook: 'yes',
    outgoingAPIMessageWebhook: 'yes',
    // Additional webhook settings for comprehensive coverage
    pollMessageWebhook: 'yes',
    incomingCallWebhook: 'yes',
    editedMessageWebhook: 'yes',
    deletedMessageWebhook: 'yes',
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

  console.log('📤 Sending payload:', JSON.stringify(settingsPayload, null, 2));
  console.log('📡 Response status:', response.status);
  console.log(
    '📡 Response headers:',
    Object.fromEntries(response.headers.entries())
  );

  const result = await response.json();
  console.log('📥 Full API response:', JSON.stringify(result, null, 2));

  if (result.saveSettings === true) {
    console.log('✅ Webhook configured successfully!');
    console.log('🔔 Green API will now send webhooks to your server');
    console.log('📝 Text messages: ENABLED');
    console.log('🖼️  Image messages: ENABLED');
    console.log('📁 File messages: ENABLED');
    console.log('🎥 Video messages: ENABLED');
    console.log('🎵 Audio messages: ENABLED');
    console.log('📄 Document messages: ENABLED');
    console.log('📋 Test by sending a message to your WhatsApp group');
    console.log(
      `🎯 Only messages from group ${env.TARGET_GROUP_ID} will be processed`
    );
  } else {
    console.error('❌ Failed to configure webhook:', result);
    console.error('🔍 This means Green API rejected our configuration');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  configureWebhook().catch(console.error);
}
