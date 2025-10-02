// Load environment variables first
import { config } from 'dotenv';
config({ path: '.env.local', override: true });

const WHAPI_BASE_URL = process.env.WHAPI_BASE_URL;
const WHAPI_TOKEN = process.env.WHAPI_TOKEN;
const TARGET_GROUP_ID = '79296430333-1565970647@g.us'; // Распродажа Садовода

console.log('🔍 Testing Polling Methods for Historical Messages');
console.log('==================================================');
console.log(`Group ID: ${TARGET_GROUP_ID}`);

async function testPollingMethods() {
  console.log('\n1. Testing different polling parameters...');
  
  const pollingTests = [
    {
      name: 'Basic list (no filters)',
      params: 'count=50&offset=0&sort=desc'
    },
    {
      name: 'With time_from (24 hours ago)',
      params: 'count=50&offset=0&sort=desc&time_from=' + Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000)
    },
    {
      name: 'With time_from (7 days ago)',
      params: 'count=50&offset=0&sort=desc&time_from=' + Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000)
    },
    {
      name: 'With time_from (30 days ago)',
      params: 'count=50&offset=0&sort=desc&time_from=' + Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)
    },
    {
      name: 'With time range (last 7 days)',
      params: 'count=50&offset=0&sort=desc&time_from=' + Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000) + '&time_to=' + Math.floor(Date.now() / 1000)
    },
    {
      name: 'With archive=true',
      params: 'count=50&offset=0&sort=desc&archive=true'
    },
    {
      name: 'With full_history=true',
      params: 'count=50&offset=0&sort=desc&full_history=true'
    },
    {
      name: 'Text messages only',
      params: 'count=50&offset=0&sort=desc&types=text'
    },
    {
      name: 'Image messages only',
      params: 'count=50&offset=0&sort=desc&types=image'
    },
    {
      name: 'With normal_types=false (system messages)',
      params: 'count=50&offset=0&sort=desc&normal_types=false'
    },
    {
      name: 'With normal_types=true (user messages)',
      params: 'count=50&offset=0&sort=desc&normal_types=true'
    }
  ];
  
  for (const test of pollingTests) {
    try {
      const url = `${WHAPI_BASE_URL}/messages/list/${encodeURIComponent(TARGET_GROUP_ID)}?${test.params}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${WHAPI_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        let messages = [];
        
        if (Array.isArray(data)) {
          messages = data;
        } else if (data.data && Array.isArray(data.data)) {
          messages = data.data;
        } else if (data.messages && Array.isArray(data.messages)) {
          messages = data.messages;
        }
        
        console.log(`\n${test.name}: ${messages.length} messages`);
        
        if (messages.length > 0) {
          const firstMessage = messages[0];
          const lastMessage = messages[messages.length - 1];
          console.log(`  Latest: ${new Date(firstMessage.timestamp * 1000).toISOString()}`);
          console.log(`  Oldest: ${new Date(lastMessage.timestamp * 1000).toISOString()}`);
          
          // Count message types
          const messageTypes = {};
          const userMessages = [];
          
          messages.forEach(msg => {
            const type = msg.type || 'unknown';
            messageTypes[type] = (messageTypes[type] || 0) + 1;
            
            if (type !== 'system' && msg.text && typeof msg.text === 'string' && msg.text.trim().length > 0) {
              userMessages.push(msg);
            }
          });
          
          console.log(`  Types: ${Object.entries(messageTypes).map(([type, count]) => `${type}(${count})`).join(', ')}`);
          console.log(`  User messages: ${userMessages.length}`);
          
          if (userMessages.length > 0) {
            console.log(`  Sample user messages:`);
            userMessages.slice(0, 2).forEach((msg, index) => {
              console.log(`    ${index + 1}. [${msg.type}] ${msg.fromName || 'Unknown'}: ${msg.text.substring(0, 60)}...`);
            });
          }
        }
      } else {
        console.log(`\n${test.name}: Failed (${response.status})`);
        const errorText = await response.text();
        console.log(`  Error: ${errorText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`\n${test.name}: Error - ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n2. Testing pagination to get more messages...');
  
  try {
    let totalMessages = 0;
    let offset = 0;
    const limit = 100;
    let hasMore = true;
    let batchCount = 0;
    const maxBatches = 10;
    
    while (hasMore && batchCount < maxBatches) {
      batchCount++;
      const url = `${WHAPI_BASE_URL}/messages/list/${encodeURIComponent(TARGET_GROUP_ID)}?count=${limit}&offset=${offset}&sort=desc`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${WHAPI_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        let messages = [];
        
        if (Array.isArray(data)) {
          messages = data;
        } else if (data.data && Array.isArray(data.data)) {
          messages = data.data;
        } else if (data.messages && Array.isArray(data.messages)) {
          messages = data.messages;
        }
        
        console.log(`Batch ${batchCount}: ${messages.length} messages (offset: ${offset})`);
        totalMessages += messages.length;
        
        if (messages.length < limit) {
          hasMore = false;
          console.log(`  Reached end of messages (got ${messages.length} < ${limit})`);
        } else {
          offset += limit;
        }
        
        if (messages.length > 0) {
          const firstMessage = messages[0];
          const lastMessage = messages[messages.length - 1];
          console.log(`  Range: ${new Date(lastMessage.timestamp * 1000).toISOString()} to ${new Date(firstMessage.timestamp * 1000).toISOString()}`);
        }
      } else {
        console.log(`Batch ${batchCount}: Failed (${response.status})`);
        hasMore = false;
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n📊 Total messages found via pagination: ${totalMessages}`);
    
  } catch (error) {
    console.log(`❌ Error testing pagination: ${error.message}`);
  }
  
  console.log('\n3. Testing different groups to see if any have historical data...');
  
  try {
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
      
      // Test first few groups for historical messages
      for (let i = 0; i < Math.min(3, groups.length); i++) {
        const group = groups[i];
        const groupId = group.id || group.jid;
        const groupName = group.name || group.subject || 'Unknown';
        
        console.log(`\nTesting group: ${groupName} (${groupId})`);
        
        const testUrl = `${WHAPI_BASE_URL}/messages/list/${encodeURIComponent(groupId)}?count=10&offset=0&sort=desc`;
        const testResponse = await fetch(testUrl, {
          headers: {
            Authorization: `Bearer ${WHAPI_TOKEN}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (testResponse.ok) {
          const testData = await testResponse.json();
          let messages = [];
          
          if (Array.isArray(testData)) {
            messages = testData;
          } else if (testData.data && Array.isArray(testData.data)) {
            messages = testData.data;
          } else if (testData.messages && Array.isArray(testData.messages)) {
            messages = testData.messages;
          }
          
          console.log(`  Messages: ${messages.length}`);
          if (messages.length > 0) {
            const firstMessage = messages[0];
            console.log(`  Latest: ${new Date(firstMessage.timestamp * 1000).toISOString()}`);
          }
        } else {
          console.log(`  Failed: ${testResponse.status}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } else {
      console.log(`Failed to get groups: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Error testing groups: ${error.message}`);
  }
}

async function main() {
  await testPollingMethods();
  
  console.log('\n✅ Polling methods testing completed!');
  console.log('\n💡 This should show which polling method works for historical messages');
}

main().catch(console.error);
