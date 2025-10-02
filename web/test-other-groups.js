#!/usr/bin/env node

// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });

const WHAPI_BASE_URL = process.env.WHAPI_BASE_URL;
const WHAPI_TOKEN = process.env.WHAPI_TOKEN;

// Test multiple groups that might have messages
const testGroups = [
  '120363166212501014@g.us', // Умед Садовод Салют 3 / 4 / 28
  '120363261591224067@g.us', // Салют  3-2-04 Обувь Распродажа 👟👟👟
  '120363132673898104@g.us', // Исматулло 27-49. Распродажа
  '120363031523841183@g.us', // САЛЮТ 3-5-08 РАСПРОДАЖА
  '120363161712865630@g.us', // Кристина обувь ассорти
];

async function testGroupMessages(groupId) {
  try {
    const url = `${WHAPI_BASE_URL}/messages/list/${encodeURIComponent(groupId)}?count=5&sort=desc`;
    console.log(`\nTesting group: ${groupId}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WHAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log(`❌ Error ${response.status}: ${response.statusText}`);
      return;
    }

    const data = await response.json();

    if (data.messages && Array.isArray(data.messages)) {
      console.log(`✅ Found ${data.messages.length} messages (total: ${data.total})`);
      if (data.messages.length > 0) {
        console.log('Latest message:', {
          id: data.messages[0].id,
          type: data.messages[0].type,
          timestamp: data.messages[0].timestamp,
          text: data.messages[0].text?.body?.substring(0, 50) + '...' || 'No text'
        });
      }
    } else {
      console.log('❌ No messages field in response');
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function main() {
  console.log('Testing multiple groups for messages...');

  for (const groupId of testGroups) {
    await testGroupMessages(groupId);
  }
}

main();
