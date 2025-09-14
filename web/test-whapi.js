#!/usr/bin/env node

/**
 * Test script for Whapi.cloud integration
 * Run with: node test-whapi.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const WEBHOOK_SECRET = process.env.WHAPI_WEBHOOK_SECRET || 'db15cd49180b9332c81d1c40b898c066058b1b196979f8bb35e056bf9394e25e';

// Test webhook setup
async function testWebhookSetup() {
  console.log('🔧 Testing webhook setup...');

  try {
    const response = await fetch(`${BASE_URL}/api/webhooks/whapi/setup`);
    const data = await response.json();

    if (data.success) {
      console.log('✅ Webhook setup successful:', data.message);
      console.log('📡 Webhook URL:', data.webhookUrl);
    } else {
      console.log('❌ Webhook setup failed:', data.message);
    }
  } catch (error) {
    console.log('❌ Webhook setup error:', error.message);
  }
}

// Test webhook with sample payload
async function testWebhook() {
  console.log('\n📨 Testing webhook with sample payload...');

  const samplePayload = {
    event: 'messages.upsert',
    data: {
      key: {
        id: 'test-message-123',
        fromMe: false,
        remoteJid: '120363123456789012@g.us', // Group JID
      },
      message: {
        conversation: 'Красные туфли на каблуке, размер 38, цена 5000 рублей',
      },
      pushName: 'Test User',
      timestamp: Date.now(),
    },
  };

  try {
    const response = await fetch(`${BASE_URL}/api/webhooks/whapi/${WEBHOOK_SECRET}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(samplePayload),
    });

    const data = await response.json();

    if (data.ok) {
      console.log('✅ Webhook test successful');
    } else {
      console.log('❌ Webhook test failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Webhook test error:', error.message);
  }
}

// Test webhook with media payload
async function testWebhookWithMedia() {
  console.log('\n📸 Testing webhook with media payload...');

  const samplePayload = {
    event: 'messages.upsert',
    data: {
      key: {
        id: 'test-message-456',
        fromMe: false,
        remoteJid: '120363123456789012@g.us', // Group JID
      },
      message: {
        imageMessage: {
          caption: 'Черные ботинки, размер 42, цена 8000 рублей',
          mimetype: 'image/jpeg',
          url: 'https://example.com/test-image.jpg',
        },
      },
      pushName: 'Test User',
      timestamp: Date.now(),
    },
  };

  try {
    const response = await fetch(`${BASE_URL}/api/webhooks/whapi/${WEBHOOK_SECRET}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(samplePayload),
    });

    const data = await response.json();

    if (data.ok) {
      console.log('✅ Webhook with media test successful');
    } else {
      console.log('❌ Webhook with media test failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Webhook with media test error:', error.message);
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Whapi.cloud integration tests...\n');

  await testWebhookSetup();
  await testWebhook();
  await testWebhookWithMedia();

  console.log('\n✨ Tests completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Set up your environment variables in .env.local');
  console.log('2. Start your Next.js development server: npm run dev');
  console.log('3. Configure your Whapi.cloud webhook URL in the panel');
  console.log('4. Send messages to your WhatsApp group to test the integration');
}

runTests().catch(console.error);
