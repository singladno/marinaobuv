// Load environment variables first
import { config } from 'dotenv';
config({ path: '.env.local', override: true });

const WHAPI_BASE_URL = process.env.WHAPI_BASE_URL;
const WHAPI_TOKEN = process.env.WHAPI_TOKEN;
const TARGET_GROUP_ID = '79296430333-1565970647@g.us'; // Распродажа Садовода

console.log('🔍 Debugging System Messages Content');
console.log('====================================');
console.log(`Group ID: ${TARGET_GROUP_ID}`);

async function debugSystemMessages() {
  try {
    const url = `${WHAPI_BASE_URL}/messages/list/${encodeURIComponent(TARGET_GROUP_ID)}?count=10&offset=0&normal_types=false&sort=desc`;

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

      console.log(`\nFound ${messages.length} system messages:`);

      messages.forEach((msg, index) => {
        console.log(`\n--- Message ${index + 1} ---`);
        console.log(`ID: ${msg.id}`);
        console.log(`Type: ${msg.type}`);
        console.log(`From: ${msg.fromName || 'Unknown'}`);
        console.log(
          `Timestamp: ${new Date(msg.timestamp * 1000).toISOString()}`
        );
        console.log(`Text: ${msg.text || 'No text'}`);
        console.log(`Raw payload keys: ${Object.keys(msg).join(', ')}`);

        // Check if it has any product-related content
        const text = msg.text || '';
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

        console.log(`Has product keywords: ${hasProductKeywords}`);
        if (hasProductKeywords) {
          console.log(
            `  Keywords found: ${productKeywords
              .filter(keyword =>
                text.toLowerCase().includes(keyword.toLowerCase())
              )
              .join(', ')}`
          );
        }

        // Show full raw payload for inspection
        console.log(`Full payload:`, JSON.stringify(msg, null, 2));
      });
    } else {
      console.log(`❌ Failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function main() {
  await debugSystemMessages();

  console.log('\n✅ System messages debugging completed!');
  console.log('\n💡 This should show what content is in the system messages');
}

main().catch(console.error);
