#!/usr/bin/env tsx

/**
 * Test script to manually send a WhatsApp notification
 * Tests the phone number format conversion fix
 */

import './load-env';
import { env } from '../lib/env';
import { formatPhoneForWhatsApp } from '../lib/utils/whatsapp-phone-extractor';

async function checkInstanceStatus() {
  const instanceId = env.GREEN_API_INSTANCE_ID;
  const token = env.GREEN_API_TOKEN;
  const baseUrl = env.GREEN_API_BASE_URL || 'https://api.green-api.com';

  console.log('🔍 Checking instance status...');
  const stateResponse = await fetch(
    `${baseUrl}/waInstance${instanceId}/getStateInstance/${token}`
  );
  const stateData = await stateResponse.json();
  console.log('📊 Instance state:', JSON.stringify(stateData, null, 2));

  if (stateData.stateInstance !== 'authorized') {
    console.log('⚠️  Instance is not authorized! Cannot send messages.');
    console.log('Current state:', stateData.stateInstance);
    return false;
  }
  console.log('✅ Instance is authorized');
  return true;
}

async function sendTestMessage(phoneNumber: string, message: string) {
  const instanceId = env.GREEN_API_INSTANCE_ID;
  const token = env.GREEN_API_TOKEN;
  const baseUrl = env.GREEN_API_BASE_URL || 'https://api.green-api.com';

  if (!instanceId || !token) {
    console.error('❌ Green API credentials not configured!');
    process.exit(1);
  }

  // Check instance status first
  const isAuthorized = await checkInstanceStatus();
  if (!isAuthorized) {
    console.warn('⚠️  Instance is not authorized, but attempting to send anyway...');
    console.warn('   (This will likely fail, but we can see the exact error)');
  }

  console.log('\n🧪 Testing WhatsApp notification...');
  console.log(`📱 Phone number (E164): ${phoneNumber}`);
  
  // Convert to WhatsApp JID format
  const chatId = formatPhoneForWhatsApp(phoneNumber);
  console.log(`📱 ChatId (WhatsApp JID): ${chatId}`);
  console.log(`💬 Message: ${message}`);

  try {
    console.log('\n📤 Sending message...');
    const response = await fetch(
      `${baseUrl}/waInstance${instanceId}/sendMessage/${token}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: chatId,
          message: message,
        }),
      }
    );

    const responseText = await response.text();
    console.log(`📡 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = responseText;
      }
      console.error('❌ Failed to send message:');
      console.error(JSON.stringify(errorData, null, 2));
      process.exit(1);
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = responseText;
    }

    console.log('✅ Message sent successfully!');
    console.log('📥 Response:', JSON.stringify(result, null, 2));
    
    if (result.idMessage) {
      console.log(`\n✅ Message ID: ${result.idMessage}`);
      
      // Check message status after a short delay
      console.log('\n⏳ Waiting 2 seconds, then checking message status...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const statusResponse = await fetch(
          `${baseUrl}/waInstance${instanceId}/checkWhatsapp/${token}`
        );
        const statusData = await statusResponse.json();
        console.log('📊 WhatsApp connection status:', JSON.stringify(statusData, null, 2));
        
        // Try to get message status
        try {
          const messageStatusResponse = await fetch(
            `${baseUrl}/waInstance${instanceId}/getMessage/${token}?idMessage=${result.idMessage}`
          );
          if (messageStatusResponse.ok) {
            const messageStatus = await messageStatusResponse.json();
            console.log('📨 Message status:', JSON.stringify(messageStatus, null, 2));
          }
        } catch (e) {
          console.log('ℹ️  Could not check message status (API might not support it)');
        }
      } catch (e) {
        console.log('ℹ️  Could not check connection status');
      }
      
      console.log('\n📱 Check your WhatsApp to see if the message was delivered.');
      console.log('⚠️  Note: If instance is not authorized, message will NOT be delivered even if API returns success.');
    }
  } catch (error) {
    console.error('❌ Error sending message:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

async function main() {
  const testPhoneNumber = '+79963663660';
  const testMessage = '🧪 Test message from webhook monitor fix. If you receive this, the phone number format conversion is working correctly!';

  await sendTestMessage(testPhoneNumber, testMessage);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

export { sendTestMessage };

