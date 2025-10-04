import { config } from 'dotenv';
config({ path: '.env.local', override: true });
import { env } from './src/lib/env';

async function testGreenApi() {
  try {
    const url = `${env.GREEN_API_BASE_URL}/waInstance${env.GREEN_API_INSTANCE_ID}/lastIncomingMessages/${env.GREEN_API_TOKEN}?minutes=60`;
    console.log('Testing URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`API failed: ${response.status}`);
    }

    const messages = await response.json();
    console.log(`Got ${messages.length} messages`);

    // Check first few messages for structure
    messages.slice(0, 3).forEach((msg: any, i: number) => {
      console.log(`\nMessage ${i + 1}:`);
      console.log(`  Type: ${msg.typeMessage}`);
      console.log(`  DownloadUrl: ${msg.downloadUrl ? 'YES' : 'NO'}`);
      console.log(`  MimeType: ${msg.mimeType}`);
      console.log(`  Text: ${msg.textMessage?.substring(0, 50)}...`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

testGreenApi().catch(console.error);
