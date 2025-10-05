#!/bin/bash

# Test VPN using proxy services
echo "🧪 Testing VPN alternatives for OpenAI access..."

# Test 1: Use a proxy service
echo "📡 Testing with proxy service..."

# Create a simple proxy test
cat > test-proxy-openai.js << 'EOF'
import https from 'https';
import { HttpsProxyAgent } from 'https-proxy-agent';

const testWithProxy = async (proxyUrl) => {
  console.log(`🧪 Testing OpenAI with proxy: ${proxyUrl}`);
  
  const agent = new HttpsProxyAgent(proxyUrl);
  
  const options = {
    hostname: 'api.openai.com',
    port: 443,
    path: '/v1/models',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    agent: agent
  };

  const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ OpenAI API accessible through proxy!');
        const models = JSON.parse(data);
        console.log(`📊 Available models: ${models.data.length}`);
      } else {
        console.log('❌ OpenAI API error:', res.statusCode);
        console.log('Response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Connection error:', error.message);
  });

  req.end();
};

// Test with different proxy services
const proxies = [
  'http://proxy-server.com:8080',
  'http://free-proxy.com:3128',
  'http://proxy-list.com:8080'
];

if (!process.env.OPENAI_API_KEY) {
  console.log('❌ Please set OPENAI_API_KEY environment variable');
  process.exit(1);
}

// Test direct connection first
console.log('🧪 Testing direct connection...');
testWithProxy(null);

// Test with proxies
proxies.forEach(proxy => {
  setTimeout(() => testWithProxy(proxy), 1000);
});
EOF

# Install required packages
echo "📦 Installing proxy packages..."
cd /Users/dali/Desktop/marinaobuv/web
npm install https-proxy-agent

# Test the proxy
echo "🧪 Testing proxy connection..."
source .env.local && node test-proxy-openai.js

echo "✅ Proxy test complete!"
