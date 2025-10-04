#!/usr/bin/env tsx

/**
 * Simple Green API test - just try to fetch messages without all the settings checks
 */

// Load environment variables from .env.local BEFORE any other imports
import './load-env';

import { greenApiFetcher } from '../lib/green-api-fetcher';
import { env } from '../lib/env';

/**
 * Simple test to fetch messages
 */
async function simpleTest() {
  console.log('🚀 Simple Green API Test\n');

  const chatId = env.TARGET_GROUP_ID;
  if (!chatId) {
    console.error('❌ TARGET_GROUP_ID not configured!');
    return;
  }

  console.log(`🎯 Target group: ${chatId}`);
  console.log(`🔧 Instance ID: ${env.GREEN_API_INSTANCE_ID}`);

  try {
    console.log('\n📨 Attempting to fetch messages...');

    // Try to fetch just a few messages
    const messages = await greenApiFetcher.getChatHistory({
      chatId,
      count: 5,
    });

    console.log(`✅ Successfully fetched ${messages.length} messages!`);

    if (messages.length > 0) {
      console.log('\n📝 First message:');
      const firstMessage = messages[0];
      console.log(`   ID: ${firstMessage.idMessage}`);
      console.log(`   Type: ${firstMessage.typeMessage}`);
      console.log(`   Sender: ${firstMessage.senderName || 'Unknown'}`);
      console.log(`   Text: ${firstMessage.textMessage || 'No text'}`);
      console.log(
        `   Timestamp: ${new Date(firstMessage.timestamp * 1000).toISOString()}`
      );
      console.log(`   Is Group: ${firstMessage.isGroup}`);
    }

    console.log(
      '\n🎉 Green API is working! You can now fetch messages from your group.'
    );
  } catch (error) {
    console.error('❌ Error fetching messages:', error);

    if ((error as Error).message.includes('429')) {
      console.log(
        '\n💡 Rate limit hit - this is normal for Green API free tier'
      );
      console.log('   Wait a few minutes and try again, or upgrade your plan');
    } else if ((error as Error).message.includes('Not Authorized')) {
      console.log(
        '\n💡 Instance not authorized - make sure your WhatsApp is connected'
      );
      console.log('   Go to your Green API dashboard and scan the QR code');
    } else {
      console.log('\n💡 Check your Green API dashboard for more details');
    }
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  simpleTest().catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
}

export { simpleTest };
