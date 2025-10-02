// Load environment variables first
import { config } from 'dotenv';
config({ path: '.env.local', override: true });

const WHAPI_BASE_URL = process.env.WHAPI_BASE_URL;
const WHAPI_TOKEN = process.env.WHAPI_TOKEN;

console.log('🔍 Checking WHAPI Account Status');
console.log('=================================');

async function checkAccountStatus() {
  console.log('\n1. Checking account health...');

  try {
    const healthUrl = `${WHAPI_BASE_URL}/health`;
    const response = await fetch(healthUrl, {
      headers: {
        Authorization: `Bearer ${WHAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Health check passed');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ Health check failed: ${response.status}`);
      const errorText = await response.text();
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.log(`❌ Health check error: ${error.message}`);
  }

  console.log('\n2. Checking account settings...');

  try {
    const settingsUrl = `${WHAPI_BASE_URL}/settings`;
    const response = await fetch(settingsUrl, {
      headers: {
        Authorization: `Bearer ${WHAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Settings retrieved');
      console.log('Settings:', JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ Settings failed: ${response.status}`);
      const errorText = await response.text();
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.log(`❌ Settings error: ${error.message}`);
  }

  console.log('\n3. Checking account limits...');

  try {
    const limitsUrl = `${WHAPI_BASE_URL}/limits`;
    const response = await fetch(limitsUrl, {
      headers: {
        Authorization: `Bearer ${WHAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Limits retrieved');
      console.log('Limits:', JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ Limits failed: ${response.status}`);
      const errorText = await response.text();
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.log(`❌ Limits error: ${error.message}`);
  }

  console.log('\n4. Checking available events...');

  try {
    const eventsUrl = `${WHAPI_BASE_URL}/settings/events`;
    const response = await fetch(eventsUrl, {
      headers: {
        Authorization: `Bearer ${WHAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Events retrieved');
      console.log('Events:', JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ Events failed: ${response.status}`);
      const errorText = await response.text();
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.log(`❌ Events error: ${error.message}`);
  }

  console.log('\n5. Testing groups endpoint...');

  try {
    const groupsUrl = `${WHAPI_BASE_URL}/groups`;
    const response = await fetch(groupsUrl, {
      headers: {
        Authorization: `Bearer ${WHAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Groups retrieved');
      console.log(
        'Groups count:',
        Array.isArray(data) ? data.length : 'Not an array'
      );
      console.log('Groups data:', JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ Groups failed: ${response.status}`);
      const errorText = await response.text();
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.log(`❌ Groups error: ${error.message}`);
  }

  console.log('\n6. Testing chats endpoint...');

  try {
    const chatsUrl = `${WHAPI_BASE_URL}/chats`;
    const response = await fetch(chatsUrl, {
      headers: {
        Authorization: `Bearer ${WHAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Chats retrieved');
      console.log(
        'Chats count:',
        Array.isArray(data) ? data.length : 'Not an array'
      );
      console.log('Chats data:', JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ Chats failed: ${response.status}`);
      const errorText = await response.text();
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.log(`❌ Chats error: ${error.message}`);
  }
}

async function main() {
  await checkAccountStatus();

  console.log('\n✅ Account status check completed!');
  console.log('\n💡 This should show what the WHAPI account can access');
}

main().catch(console.error);
