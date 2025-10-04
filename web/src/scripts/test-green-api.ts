#!/usr/bin/env tsx

/**
 * Test script for Green API message fetching
 * Usage: npx tsx src/scripts/test-green-api.ts
 */

// Load environment variables from .env.local BEFORE any other imports
import './load-env';

import { greenApiFetcher } from '../lib/green-api-fetcher';
import { env } from '../lib/env';

/**
 * Test Green API connection and settings
 */
async function testConnection() {
  console.log('🔍 Testing Green API connection...');

  try {
    // Check if instance is ready
    const isReady = await greenApiFetcher.isReady();
    console.log(`✅ Instance ready: ${isReady}`);

    if (!isReady) {
      console.log(
        '⚠️  Instance not ready, attempting to enable required settings...'
      );
      await greenApiFetcher.enableMessageFetching();

      // Wait a bit for settings to take effect
      console.log('⏳ Waiting for settings to take effect...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      const isReadyAfter = await greenApiFetcher.isReady();
      console.log(`✅ Instance ready after settings: ${isReadyAfter}`);
    }

    // Get current settings
    const settings = await greenApiFetcher.getSettings();
    console.log('📋 Current settings:', JSON.stringify(settings, null, 2));

    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
}

/**
 * Test fetching messages from a group chat
 */
async function testFetchMessages(chatId: string, limit: number = 10) {
  console.log(`📨 Testing message fetching from ${chatId}...`);

  try {
    const messages = await greenApiFetcher.fetchGroupMessages(chatId, limit);

    console.log(`✅ Fetched ${messages.length} messages`);

    // Display first few messages
    messages.slice(0, 3).forEach((message, index) => {
      console.log(`\n📝 Message ${index + 1}:`);
      console.log(`   ID: ${message.idMessage}`);
      console.log(`   Type: ${message.typeMessage}`);
      console.log(`   Sender: ${message.senderName || 'Unknown'}`);
      console.log(`   Text: ${message.textMessage || 'No text'}`);
      console.log(
        `   Timestamp: ${new Date(message.timestamp * 1000).toISOString()}`
      );
      console.log(`   Is Group: ${message.isGroup}`);
      console.log(`   Is From Me: ${message.isFromMe}`);
    });

    return messages;
  } catch (error) {
    console.error('❌ Message fetching failed:', error);
    return [];
  }
}

/**
 * Test fetching a specific message
 */
async function testGetMessage(chatId: string, messageId: string) {
  console.log(`🔍 Testing specific message fetch: ${messageId}`);

  try {
    const message = await greenApiFetcher.getMessage({
      chatId,
      idMessage: messageId,
    });

    console.log('✅ Retrieved specific message:');
    console.log(`   ID: ${message.idMessage}`);
    console.log(`   Type: ${message.typeMessage}`);
    console.log(`   Sender: ${message.senderName || 'Unknown'}`);
    console.log(`   Text: ${message.textMessage || 'No text'}`);
    console.log(
      `   Timestamp: ${new Date(message.timestamp * 1000).toISOString()}`
    );

    return message;
  } catch (error) {
    console.error('❌ Specific message fetch failed:', error);
    return null;
  }
}

/**
 * Convert Green API messages to WhatsApp format and test
 */
async function testMessageConversion(messages: any[]) {
  console.log('🔄 Testing message conversion...');

  try {
    const convertedMessages = messages.map(msg =>
      greenApiFetcher.convertToWhatsAppMessage(msg)
    );

    console.log(
      `✅ Converted ${convertedMessages.length} messages to WhatsApp format`
    );

    // Display first converted message
    if (convertedMessages.length > 0) {
      console.log('\n📝 Converted message example:');
      console.log(JSON.stringify(convertedMessages[0], null, 2));
    }

    return convertedMessages;
  } catch (error) {
    console.error('❌ Message conversion failed:', error);
    return [];
  }
}

/**
 * Main test function
 */
async function main() {
  console.log('🚀 Starting Green API test...\n');

  // Check environment variables
  if (!env.GREEN_API_INSTANCE_ID || !env.GREEN_API_TOKEN) {
    console.error('❌ Green API credentials not configured!');
    console.log('Please set the following environment variables:');
    console.log('  GREEN_API_INSTANCE_ID=your_instance_id');
    console.log('  GREEN_API_TOKEN=your_token');
    console.log('  GREEN_API_BASE_URL=https://api.green-api.com (optional)');
    process.exit(1);
  }

  console.log('✅ Green API credentials configured');
  console.log(`   Instance ID: ${env.GREEN_API_INSTANCE_ID}`);
  console.log(
    `   Base URL: ${env.GREEN_API_BASE_URL || 'https://api.green-api.com'}`
  );
  console.log(`   Token: ${env.GREEN_API_TOKEN.substring(0, 8)}...`);

  // Test connection
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.error('❌ Connection test failed, exiting...');
    process.exit(1);
  }

  // Get target group ID
  const targetGroupId = env.TARGET_GROUP_ID;
  if (!targetGroupId) {
    console.error('❌ TARGET_GROUP_ID not configured!');
    console.log(
      'Please set TARGET_GROUP_ID environment variable with your group chat ID (e.g., 120363123456789012@g.us)'
    );
    process.exit(1);
  }

  console.log(`✅ Target group ID: ${targetGroupId}`);

  // Test fetching messages
  const messages = await testFetchMessages(targetGroupId, 10);
  if (messages.length === 0) {
    console.log('⚠️  No messages fetched, but test completed');
    return;
  }

  // Test specific message fetch (use first message)
  const firstMessage = messages[0];
  await testGetMessage(targetGroupId, firstMessage.idMessage);

  // Test message conversion
  await testMessageConversion(messages);

  console.log('\n🎉 Green API test completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Verify your Green API instance is properly configured');
  console.log('2. Ensure your WhatsApp is connected to the instance');
  console.log('3. Test with your actual group chat ID');
  console.log('4. Integrate with your existing message processing pipeline');
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
}

export { main as testGreenApi };
