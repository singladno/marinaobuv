#!/usr/bin/env tsx

/**
 * Setup Green API Webhook
 * Configures Green API to send webhooks to our endpoint
 */

import './load-env';
import { env } from '../lib/env';

async function setupWebhook() {
  console.log('🔧 Setting up Green API webhook...');

  if (!env.GREEN_API_INSTANCE_ID || !env.GREEN_API_TOKEN) {
    console.error('❌ Green API credentials not configured!');
    process.exit(1);
  }

  // Production webhook URL
  const webhookUrl = 'https://www.marina-obuv.ru/api/webhooks/green-api';

  console.log(`🎯 Webhook URL: ${webhookUrl}`);
  console.log(`🔧 Instance ID: ${env.GREEN_API_INSTANCE_ID}`);

  try {
    // Enable incoming webhook
    const settingsUrl = `https://api.green-api.com/waInstance${env.GREEN_API_INSTANCE_ID}/setSettings/${env.GREEN_API_TOKEN}`;

    const settingsPayload = {
      incomingWebhook: webhookUrl,
      incomingWebhookOnAnswer: webhookUrl,
      outgoingWebhook: webhookUrl,
      outgoingMessageWebhook: webhookUrl,
      stateWebhook: webhookUrl,
      deviceWebhook: webhookUrl,
    };

    console.log('📤 Sending webhook configuration...');
    console.log('Settings payload:', JSON.stringify(settingsPayload, null, 2));

    const response = await fetch(settingsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settingsPayload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('📥 Response:', JSON.stringify(result, null, 2));

    if (result.saveSettings === true) {
      console.log('✅ Webhook configured successfully!');
      console.log('🔔 Green API will now send webhooks to:', webhookUrl);
      console.log(
        '📋 Make sure your webhook endpoint is accessible from the internet'
      );
    } else {
      console.error('❌ Failed to configure webhook:', result);
    }
  } catch (error) {
    console.error('❌ Error setting up webhook:', error);
  }
}

async function checkCurrentSettings() {
  console.log('🔍 Checking current Green API settings...');

  try {
    const settingsUrl = `https://api.green-api.com/waInstance${env.GREEN_API_INSTANCE_ID}/getSettings/${env.GREEN_API_TOKEN}`;

    const response = await fetch(settingsUrl, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const settings = await response.json();
    console.log('📋 Current settings:', JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('❌ Error checking settings:', error);
  }
}

async function main() {
  console.log('🚀 Green API Webhook Setup\n');

  if (!env.GREEN_API_INSTANCE_ID || !env.GREEN_API_TOKEN) {
    console.error('❌ Green API credentials not configured!');
    console.log('Please set the following environment variables:');
    console.log('  GREEN_API_INSTANCE_ID=your_instance_id');
    console.log('  GREEN_API_TOKEN=your_token');
    process.exit(1);
  }

  console.log(`🔧 Instance ID: ${env.GREEN_API_INSTANCE_ID}`);
  console.log(`🔑 Token: ${env.GREEN_API_TOKEN.substring(0, 8)}...`);

  // Check current settings first
  await checkCurrentSettings();

  console.log('\n' + '='.repeat(50) + '\n');

  // Setup webhook
  await setupWebhook();

  console.log('\n📋 Next Steps:');
  console.log(
    '1. Update the webhook URL in this script with your actual domain'
  );
  console.log(
    '2. Deploy your application so the webhook endpoint is accessible'
  );
  console.log(
    '3. Test by sending a message with an image to your WhatsApp group'
  );
  console.log('4. Check the database to see if media URLs are captured');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });
}

export { main as setupGreenApiWebhook };
