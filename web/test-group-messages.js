#!/usr/bin/env node

// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });

const WHAPI_BASE_URL = process.env.WHAPI_BASE_URL;
const WHAPI_TOKEN = process.env.WHAPI_TOKEN;
const TARGET_GROUP_ID = process.env.TARGET_GROUP_ID || '79296430333-1565970647@g.us';

async function testGroupMessages() {
  console.log('Testing if group has any messages...');
  console.log('Group ID:', TARGET_GROUP_ID);
  console.log('API URL:', WHAPI_BASE_URL);

  try {
    // Try to fetch messages without time restriction
    const url = `${WHAPI_BASE_URL}/messages/list/${encodeURIComponent(TARGET_GROUP_ID)}?count=10&sort=desc`;
    console.log('Request URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WHAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (Array.isArray(data)) {
      console.log(`Found ${data.length} messages`);
    } else if (data.data && Array.isArray(data.data)) {
      console.log(`Found ${data.data.length} messages in data field`);
    } else if (data.messages && Array.isArray(data.messages)) {
      console.log(`Found ${data.messages.length} messages in messages field`);
    } else {
      console.log('Unexpected response format');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testGroupMessages();
