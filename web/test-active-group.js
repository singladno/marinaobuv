#!/usr/bin/env node

// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });

const WHAPI_BASE_URL = process.env.WHAPI_BASE_URL;
const WHAPI_TOKEN = process.env.WHAPI_TOKEN;

// Test a group that we know has messages
const testGroupId = '120363166212501014@g.us'; // Умед Садовод Салют 3 / 4 / 28

async function testGroupMessages() {
  console.log('Testing group with known messages...');
  console.log('Group ID:', testGroupId);

  try {
    const url = `${WHAPI_BASE_URL}/messages/list/${encodeURIComponent(testGroupId)}?count=5&sort=desc`;
    console.log('Request URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WHAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (data.messages && Array.isArray(data.messages)) {
      console.log(`✅ Found ${data.messages.length} messages (total: ${data.total})`);
      if (data.messages.length > 0) {
        console.log('\nLatest messages:');
        data.messages.slice(0, 3).forEach((msg, i) => {
          console.log(`${i + 1}. ${msg.type} - ${msg.timestamp} - ${msg.text?.body?.substring(0, 100) || 'No text'}`);
        });
      }
    } else {
      console.log('❌ No messages field in response');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testGroupMessages();
