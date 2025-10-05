#!/bin/bash

# Setup free VPN for OpenAI access
echo "🚀 Setting up free VPN for OpenAI access..."

# Method 1: Use Cloudflare WARP (free)
echo "📡 Method 1: Cloudflare WARP"
echo "1. Install Cloudflare WARP:"
echo "   - macOS: brew install cloudflare-warp"
echo "   - Or download from: https://1.1.1.1/"
echo "2. Connect to WARP"
echo "3. Test OpenAI API"

# Method 2: Use free proxy services
echo ""
echo "📡 Method 2: Free Proxy Services"
echo "Available free proxies:"
echo "- ProxyList: https://www.proxy-list.download/"
echo "- FreeProxyList: https://free-proxy-list.net/"
echo "- ProxyScrape: https://proxyscrape.com/"

# Method 3: Use Tor (free)
echo ""
echo "📡 Method 3: Tor Browser"
echo "1. Download Tor Browser: https://www.torproject.org/"
echo "2. Configure your app to use Tor proxy"
echo "3. Test OpenAI API"

# Method 4: Use free VPN services
echo ""
echo "📡 Method 4: Free VPN Services"
echo "Available free VPNs:"
echo "- ProtonVPN: https://protonvpn.com/free-vpn"
echo "- Windscribe: https://windscribe.com/free"
echo "- TunnelBear: https://www.tunnelbear.com/"

# Create a simple test script
cat > test-openai-methods.js << 'EOF'
// Test different methods for OpenAI access
import https from 'https';

const testMethods = async () => {
  console.log('🧪 Testing different methods for OpenAI access...');
  
  // Method 1: Direct connection
  console.log('\n1️⃣ Testing direct connection...');
  await testOpenAI();
  
  // Method 2: With different User-Agent
  console.log('\n2️⃣ Testing with different User-Agent...');
  await testOpenAIWithUA();
  
  // Method 3: With different headers
  console.log('\n3️⃣ Testing with different headers...');
  await testOpenAIWithHeaders();
};

const testOpenAI = async () => {
  const options = {
    hostname: 'api.openai.com',
    port: 443,
    path: '/v1/models',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  };

  const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    if (res.statusCode === 200) {
      console.log('✅ Direct connection works!');
    } else {
      console.log('❌ Direct connection blocked');
    }
  });

  req.on('error', (error) => {
    console.log('❌ Connection error:', error.message);
  });

  req.end();
};

const testOpenAIWithUA = async () => {
  const options = {
    hostname: 'api.openai.com',
    port: 443,
    path: '/v1/models',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'OpenAI-Node/1.0.0',
      'X-Forwarded-For': '8.8.8.8'
    }
  };

  const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    if (res.statusCode === 200) {
      console.log('✅ User-Agent method works!');
    } else {
      console.log('❌ User-Agent method blocked');
    }
  });

  req.on('error', (error) => {
    console.log('❌ Connection error:', error.message);
  });

  req.end();
};

const testOpenAIWithHeaders = async () => {
  const options = {
    hostname: 'api.openai.com',
    port: 443,
    path: '/v1/models',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site'
    }
  };

  const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    if (res.statusCode === 200) {
      console.log('✅ Headers method works!');
    } else {
      console.log('❌ Headers method blocked');
    }
  });

  req.on('error', (error) => {
    console.log('❌ Connection error:', error.message);
  });

  req.end();
};

if (!process.env.OPENAI_API_KEY) {
  console.log('❌ Please set OPENAI_API_KEY environment variable');
  process.exit(1);
}

testMethods();
EOF

echo "📝 Created test script: test-openai-methods.js"
echo ""
echo "🚀 Quick Start:"
echo "1. Test different methods:"
echo "   cd /Users/dali/Desktop/marinaobuv/web"
echo "   source .env.local && node test-openai-methods.js"
echo ""
echo "2. If none work, try Cloudflare WARP:"
echo "   brew install cloudflare-warp"
echo "   warp-cli connect"
echo ""
echo "3. Or use a free VPN service"
echo ""
echo "✅ Setup complete!"
