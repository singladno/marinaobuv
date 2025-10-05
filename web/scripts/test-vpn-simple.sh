#!/bin/bash

# Simple VPN test without sudo
echo "🧪 Testing VPN setup..."

# Check if WireGuard is installed
if ! command -v wg &> /dev/null; then
    echo "❌ WireGuard not installed. Please install it first:"
    echo "   brew install wireguard-tools"
    exit 1
fi

# Check if config files exist
if [ -f "../vpn-test/server.conf" ]; then
    echo "✅ VPN config found locally"
    echo "📋 Server config:"
    cat ../vpn-test/server.conf
    echo ""
    echo "📋 Client config:"
    cat ../vpn-test/client.conf
else
    echo "❌ VPN config not found"
    exit 1
fi

# Test OpenAI API directly
echo "🧪 Testing OpenAI API..."
cd /Users/dali/Desktop/marinaobuv/web && source .env && node test-openai.mjs

echo "✅ VPN test complete!"
