#!/bin/bash

# Setup script for local OpenAI proxy testing
# This script helps you set up a local proxy for testing OpenAI API access

echo "🔧 OpenAI Proxy Setup for Local Testing"
echo "======================================"

# Check if required tools are installed
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed"
        return 1
    else
        echo "✅ $1 is installed"
        return 0
    fi
}

echo "\n📋 Checking prerequisites..."

# Check for Node.js
if ! check_tool "node"; then
    echo "Please install Node.js first"
    exit 1
fi

# Check for npm
if ! check_tool "npm"; then
    echo "Please install npm first"
    exit 1
fi

# Check for tsx (TypeScript runner)
if ! check_tool "tsx"; then
    echo "Installing tsx..."
    npm install -g tsx
fi

echo "\n🔧 Setting up local proxy options..."

# Option 1: Simple HTTP proxy using Node.js
echo "\n1️⃣ Option 1: Simple HTTP Proxy (Node.js)"
cat > simple-proxy.js << 'EOF'
const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 8080;

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    
    // Only proxy OpenAI API requests
    if (parsedUrl.hostname === 'api.openai.com' || parsedUrl.hostname === 'api.openai.com:443') {
        console.log(`🔄 Proxying request to: ${req.url}`);
        
        const options = {
            hostname: 'api.openai.com',
            port: 443,
            path: parsedUrl.path,
            method: req.method,
            headers: req.headers
        };
        
        const proxyReq = https.request(options, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        });
        
        req.pipe(proxyReq);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Simple proxy server running on port ${PORT}`);
    console.log(`   Configure OPENAI_PROXY=http://localhost:${PORT}`);
});
EOF

echo "✅ Created simple-proxy.js"

# Option 2: Using a real proxy service
echo "\n2️⃣ Option 2: Using a Real Proxy Service"
echo "   For production use, consider these options:"
echo "   - Bright Data (brightdata.com)"
echo "   - ProxyMesh (proxymesh.com)"
echo "   - Smartproxy (smartproxy.com)"
echo "   - Residential proxies with OpenAI support"

# Option 3: VPN setup instructions
echo "\n3️⃣ Option 3: VPN Setup"
echo "   For VPN setup:"
echo "   1. Install a VPN client (NordVPN, ExpressVPN, etc.)"
echo "   2. Connect to a server in a supported region (US, EU, etc.)"
echo "   3. Test OpenAI API access"
echo "   4. Configure split tunneling if needed"

echo "\n🚀 Quick Start Instructions:"
echo "=========================="
echo "1. Set your OpenAI API key:"
echo "   export OPENAI_API_KEY='your-api-key-here'"
echo ""
echo "2. Test direct connection:"
echo "   tsx test-openai-proxy.ts"
echo ""
echo "3. If you need a proxy, start the simple proxy:"
echo "   node simple-proxy.js"
echo ""
echo "4. Test with proxy:"
echo "   export OPENAI_PROXY='http://localhost:8080'"
echo "   tsx test-openai-proxy.ts"
echo ""
echo "5. Run comprehensive tests:"
echo "   tsx test-proxy-config.ts"

echo "\n📝 Environment Variables:"
echo "OPENAI_API_KEY=your_api_key_here"
echo "OPENAI_PROXY=http://localhost:8080  # Optional"
echo "OPENAI_REQUEST_DELAY_MS=1000        # Optional delay between requests"

echo "\n🎯 Next Steps:"
echo "1. Set your OpenAI API key"
echo "2. Run the test script to check direct connection"
echo "3. If you get 403 errors, set up a proxy"
echo "4. Test the proxy configuration"
echo "5. Deploy the working configuration to your server"
