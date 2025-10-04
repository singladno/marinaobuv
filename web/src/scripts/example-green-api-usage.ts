#!/usr/bin/env tsx

/**
 * Example usage of Green API integration
 * This shows how to use Green API in your existing codebase
 */

// Load environment variables from .env.local BEFORE any other imports
import './load-env';

import { greenApiFetcher } from '../lib/green-api-fetcher';
import { env } from '../lib/env';

/**
 * Example 1: Basic message fetching
 */
async function exampleBasicFetching() {
  console.log('📨 Example 1: Basic message fetching');

  const chatId = env.TARGET_GROUP_ID;
  if (!chatId) {
    console.error('TARGET_GROUP_ID not configured');
    return;
  }

  try {
    // Fetch last 10 messages
    const messages = await greenApiFetcher.getChatHistory({
      chatId,
      count: 10,
    });

    console.log(`✅ Fetched ${messages.length} messages`);

    // Display first message
    if (messages.length > 0) {
      const firstMessage = messages[0];
      console.log('First message:', {
        id: firstMessage.idMessage,
        text: firstMessage.textMessage,
        sender: firstMessage.senderName,
        timestamp: new Date(firstMessage.timestamp * 1000).toISOString(),
      });
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

/**
 * Example 2: Fetching with pagination
 */
async function examplePaginationFetching() {
  console.log('📨 Example 2: Pagination fetching');

  const chatId = env.TARGET_GROUP_ID;
  if (!chatId) {
    console.error('TARGET_GROUP_ID not configured');
    return;
  }

  try {
    // Fetch messages with pagination
    const messages = await greenApiFetcher.fetchGroupMessages(chatId, 50, {
      maxMessages: 200,
    });

    console.log(`✅ Fetched ${messages.length} messages with pagination`);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

/**
 * Example 3: Checking instance status
 */
async function exampleInstanceStatus() {
  console.log('🔍 Example 3: Checking instance status');

  try {
    // Check if instance is ready
    const isReady = await greenApiFetcher.isReady();
    console.log(`Instance ready: ${isReady}`);

    if (!isReady) {
      console.log('Enabling required settings...');
      await greenApiFetcher.enableMessageFetching();

      // Wait for settings to take effect
      await new Promise(resolve => setTimeout(resolve, 5000));

      const isReadyAfter = await greenApiFetcher.isReady();
      console.log(`Instance ready after settings: ${isReadyAfter}`);
    }

    // Get current settings
    const settings = await greenApiFetcher.getSettings();
    console.log('Current settings:', {
      incomingWebhook: settings.incomingWebhook,
      outgoingWebhook: settings.outgoingWebhook,
      sendFromPhone: settings.sendFromPhone,
    });
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

/**
 * Example 4: Message conversion
 */
async function exampleMessageConversion() {
  console.log('🔄 Example 4: Message conversion');

  const chatId = env.TARGET_GROUP_ID;
  if (!chatId) {
    console.error('TARGET_GROUP_ID not configured');
    return;
  }

  try {
    // Fetch a message
    const messages = await greenApiFetcher.getChatHistory({
      chatId,
      count: 1,
    });

    if (messages.length > 0) {
      const greenMessage = messages[0];

      // Convert to WhatsApp format
      const whatsappMessage =
        greenApiFetcher.convertToWhatsAppMessage(greenMessage);

      console.log('Green API message:', {
        id: greenMessage.idMessage,
        type: greenMessage.typeMessage,
        text: greenMessage.textMessage,
      });

      console.log('Converted WhatsApp message:', {
        id: whatsappMessage.id,
        type: whatsappMessage.type,
        text: whatsappMessage.text,
      });
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

/**
 * Example 5: Error handling
 */
async function exampleErrorHandling() {
  console.log('⚠️  Example 5: Error handling');

  try {
    // Try to fetch from a non-existent chat
    await greenApiFetcher.getChatHistory({
      chatId: 'invalid_chat_id',
      count: 10,
    });
  } catch (error) {
    console.log('✅ Caught expected error:', (error as Error).message);
  }
}

/**
 * Main function to run all examples
 */
async function main() {
  console.log('🚀 Green API Usage Examples\n');

  // Check if credentials are configured
  if (!env.GREEN_API_INSTANCE_ID || !env.GREEN_API_TOKEN) {
    console.error('❌ Green API credentials not configured!');
    console.log(
      'Please set GREEN_API_INSTANCE_ID and GREEN_API_TOKEN environment variables.'
    );
    return;
  }

  if (!env.TARGET_GROUP_ID) {
    console.error('❌ TARGET_GROUP_ID not configured!');
    console.log('Please set TARGET_GROUP_ID environment variable.');
    return;
  }

  console.log('✅ Green API credentials configured');
  console.log(`   Instance ID: ${env.GREEN_API_INSTANCE_ID}`);
  console.log(`   Target Group: ${env.TARGET_GROUP_ID}\n`);

  // Run examples
  await exampleInstanceStatus();
  console.log('');

  await exampleBasicFetching();
  console.log('');

  await examplePaginationFetching();
  console.log('');

  await exampleMessageConversion();
  console.log('');

  await exampleErrorHandling();
  console.log('');

  console.log('🎉 All examples completed!');
}

// Run the examples
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Examples failed:', error);
    process.exit(1);
  });
}

export { main as runGreenApiExamples };
