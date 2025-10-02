// Load environment variables first
import { config } from 'dotenv';
config({ path: '.env.local', override: true });

const WHAPI_BASE_URL = process.env.WHAPI_BASE_URL;
const WHAPI_TOKEN = process.env.WHAPI_TOKEN;

console.log('🔍 Testing Other Groups for User Messages');
console.log('==========================================');

async function testOtherGroups() {
  try {
    // Get all groups
    const groupsUrl = `${WHAPI_BASE_URL}/groups`;
    const response = await fetch(groupsUrl, {
      headers: {
        Authorization: `Bearer ${WHAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const groups = await response.json();
      console.log(`Found ${groups.length} groups`);

      // Test each group for user messages
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const groupId = group.id || group.jid;
        const groupName = group.name || group.subject || 'Unknown';

        console.log(`\n--- Group ${i + 1}: ${groupName} ---`);
        console.log(`ID: ${groupId}`);

        // Test for user messages
        const userMessagesUrl = `${WHAPI_BASE_URL}/messages/list/${encodeURIComponent(groupId)}?count=5&offset=0&normal_types=true&sort=desc`;
        const userResponse = await fetch(userMessagesUrl, {
          headers: {
            Authorization: `Bearer ${WHAPI_TOKEN}`,
            'Content-Type': 'application/json',
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          let userMessages = [];

          if (Array.isArray(userData)) {
            userMessages = userData;
          } else if (userData.data && Array.isArray(userData.data)) {
            userMessages = userData.data;
          } else if (userData.messages && Array.isArray(userData.messages)) {
            userMessages = userData.messages;
          }

          console.log(`User messages: ${userMessages.length}`);

          if (userMessages.length > 0) {
            const firstMessage = userMessages[0];
            console.log(
              `  Latest: ${new Date(firstMessage.timestamp * 1000).toISOString()}`
            );
            console.log(`  Type: ${firstMessage.type}`);
            console.log(`  From: ${firstMessage.fromName || 'Unknown'}`);
            console.log(
              `  Text: ${firstMessage.text ? firstMessage.text.substring(0, 100) + '...' : 'No text'}`
            );

            // Check for product keywords
            const text = firstMessage.text || '';
            const productKeywords = [
              'размер',
              'пара',
              'цена',
              'товар',
              'обувь',
              'продажа',
              'скидка',
              'акция',
            ];
            const hasProductKeywords = productKeywords.some(keyword =>
              text.toLowerCase().includes(keyword.toLowerCase())
            );
            console.log(`  Has product keywords: ${hasProductKeywords}`);
          }
        } else {
          console.log(`User messages: Failed (${userResponse.status})`);
        }

        // Test for system messages
        const systemMessagesUrl = `${WHAPI_BASE_URL}/messages/list/${encodeURIComponent(groupId)}?count=3&offset=0&normal_types=false&sort=desc`;
        const systemResponse = await fetch(systemMessagesUrl, {
          headers: {
            Authorization: `Bearer ${WHAPI_TOKEN}`,
            'Content-Type': 'application/json',
          },
        });

        if (systemResponse.ok) {
          const systemData = await systemResponse.json();
          let systemMessages = [];

          if (Array.isArray(systemData)) {
            systemMessages = systemData;
          } else if (systemData.data && Array.isArray(systemData.data)) {
            systemMessages = systemData.data;
          } else if (
            systemData.messages &&
            Array.isArray(systemData.messages)
          ) {
            systemMessages = systemData.messages;
          }

          console.log(`System messages: ${systemMessages.length}`);
        } else {
          console.log(`System messages: Failed (${systemResponse.status})`);
        }

        // Small delay between groups
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } else {
      console.log(`❌ Failed to get groups: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function main() {
  await testOtherGroups();

  console.log('\n✅ Other groups testing completed!');
  console.log(
    '\n💡 This should show which groups have accessible user messages'
  );
}

main().catch(console.error);
