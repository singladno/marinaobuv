import https from 'https';
import dotenv from 'dotenv';

async function configureWebhook() {
  const instanceId = process.env.GREEN_API_INSTANCE_ID;
  const token = process.env.GREEN_API_TOKEN;
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

  const settingsPayload = {
    incomingWebhook: webhookUrl,
    incomingWebhookOnAnswer: webhookUrl,
    outgoingWebhook: webhookUrl,
    outgoingMessageWebhook: webhookUrl,
    stateWebhook: webhookUrl,
    deviceWebhook: webhookUrl,
  };

  const postData = JSON.stringify(settingsPayload);

  const options = {
    hostname: 'api.green-api.com',
    port: 443,
    path: `/waInstance${instanceId}/setSettings/${token}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  const req = https.request(options, res => {
    let data = '';

    res.on('data', chunk => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('📥 Green API Response:');
      console.log(data);

      try {
        const result = JSON.parse(data);
        if (result.saveSettings === true) {
          console.log('✅ Webhook configured successfully!');
          console.log(
            '🔔 Green API will now send webhooks to your local server'
          );
          console.log(
            '📋 Test by sending an image message to your WhatsApp group'
          );
        } else {
          console.error('❌ Failed to configure webhook:', result);
        }
      } catch (error) {
        console.error('❌ Error parsing response:', error);
      }
    });
  });

  req.on('error', error => {
    console.error('❌ Request error:', error);
  });

  req.write(postData);
  req.end();
}

// Load environment variables
dotenv.config({ path: '.env.local' });

configureWebhook().catch(console.error);
