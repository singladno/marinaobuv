#!/usr/bin/env tsx

/**
 * Configure Green API webhook for the **admin** instance (second number).
 * Uses the same public URL as the catalog instance (`getGreenApiIncomingWebhookUrl`).
 *
 * Requires: GREEN_API_ADMIN_INSTANCE_ID, GREEN_API_ADMIN_TOKEN
 */

import './load-env';
import { env } from '../lib/env';
import {
  applyGreenApiWebhookSettings,
  buildGreenApiWebhookSettingsPayload,
} from '../lib/server/green-api-webhook-settings';

async function main() {
  const instanceId = env.GREEN_API_ADMIN_INSTANCE_ID;
  const token = env.GREEN_API_ADMIN_TOKEN;

  if (!instanceId || !token) {
    console.error(
      '❌ Admin Green API credentials not configured. Set GREEN_API_ADMIN_INSTANCE_ID and GREEN_API_ADMIN_TOKEN.'
    );
    process.exit(1);
  }

  const baseUrl = env.GREEN_API_BASE_URL;
  const settingsPayload = buildGreenApiWebhookSettingsPayload();
  console.log('🔧 Configuring Green API webhook (admin instance)...');
  console.log(`🎯 Webhook URL: ${settingsPayload.webhookUrl}`);
  console.log(`🔧 Admin instance ID: ${instanceId}`);
  console.log('📤 Sending payload:', JSON.stringify(settingsPayload, null, 2));

  const result = await applyGreenApiWebhookSettings({
    instanceId,
    token,
    baseUrl,
  });

  console.log('📥 API response:', JSON.stringify(result, null, 2));

  if (result.saveSettings === true) {
    console.log('✅ Admin instance webhook configured successfully!');
  } else {
    console.error('❌ Failed to configure admin webhook:', result);
    process.exit(1);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
