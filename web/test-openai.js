// Test OpenAI API through VPN
import https from 'https';

const testOpenAI = async () => {
  console.log('🧪 Testing OpenAI API...');

  const options = {
    hostname: 'api.openai.com',
    port: 443,
    path: '/v1/models',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
  };

  const req = https.request(options, res => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);

    let data = '';
    res.on('data', chunk => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ OpenAI API accessible!');
        const models = JSON.parse(data);
        console.log(`📊 Available models: ${models.data.length}`);
      } else {
        console.log('❌ OpenAI API error:', res.statusCode);
        console.log('Response:', data);
      }
    });
  });

  req.on('error', error => {
    console.log('❌ Connection error:', error.message);
  });

  req.end();
};

// Check if API key is set
if (!process.env.OPENAI_API_KEY) {
  console.log('❌ Please set OPENAI_API_KEY environment variable');
  process.exit(1);
}

testOpenAI();
