#!/bin/bash

# Script to test proxy connection
# Usage: ./test-proxy.sh

set -e

echo "🧪 Testing proxy connection..."

# Load environment variables
if [ -f .env ]; then
    echo "📁 Loading .env..."
    source .env
else
    echo "❌ .env not found!"
    echo "Please create .env with your proxy settings first."
    exit 1
fi

# Check if proxy variables are set
if [ -z "$HTTPS_PROXY" ] && [ -z "$HTTP_PROXY" ]; then
    echo "❌ No proxy configured in .env"
    echo "Please set HTTPS_PROXY or HTTP_PROXY in .env"
    exit 1
fi

PROXY_URL=${HTTPS_PROXY:-$HTTP_PROXY}
echo "🌐 Using proxy: $PROXY_URL"

# Test 1: Check current country
echo ""
echo "🌍 Test 1: Checking current country..."
COUNTRY=$(curl -sS -x "$PROXY_URL" ifconfig.io/country 2>/dev/null || echo "FAILED")
echo "📍 Current country: $COUNTRY"

# Test 2: Check city
echo ""
echo "🏙️ Test 2: Checking current city..."
CITY=$(curl -sS -x "$PROXY_URL" ifconfig.io/city 2>/dev/null || echo "FAILED")
echo "🏙️ Current city: $CITY"

# Test 3: Check IP
echo ""
echo "🔍 Test 3: Checking current IP..."
IP=$(curl -sS -x "$PROXY_URL" ifconfig.io/ip 2>/dev/null || echo "FAILED")
echo "🌐 Current IP: $IP"

# Test 4: Test OpenAI API (if API key is available)
if [ -n "$OPENAI_API_KEY" ]; then
    echo ""
    echo "🤖 Test 4: Testing OpenAI API access..."
    echo "Testing without proxy (should fail in Russia)..."
    
    # Test without proxy first
    echo "❌ Testing direct connection (should fail):"
    curl -sS https://api.openai.com/v1/models \
      -H "Authorization: Bearer $OPENAI_API_KEY" \
      --max-time 10 2>/dev/null | head -n 3 || echo "✅ Direct connection failed as expected"
    
    echo ""
    echo "✅ Testing with proxy:"
    OPENAI_RESPONSE=$(curl -sS https://api.openai.com/v1/models \
      -H "Authorization: Bearer $OPENAI_API_KEY" \
      -x "$PROXY_URL" \
      --max-time 30 2>/dev/null || echo "FAILED")
    
    if echo "$OPENAI_RESPONSE" | grep -q "unsupported_country_region_territory"; then
        echo "❌ Still getting region error - proxy might not be working"
    elif echo "$OPENAI_RESPONSE" | grep -q "error"; then
        echo "⚠️  Got error response:"
        echo "$OPENAI_RESPONSE" | head -n 3
    else
        echo "✅ OpenAI API accessible through proxy!"
        echo "📋 Response preview:"
        echo "$OPENAI_RESPONSE" | head -n 5
    fi
else
    echo ""
    echo "⚠️  OPENAI_API_KEY not set, skipping OpenAI test"
fi

# Test 5: Test with Node.js application
echo ""
echo "🧪 Test 5: Testing with Node.js application..."
echo "Running: npm run parse (with proxy support)"

# Set environment variables for the test
export HTTPS_PROXY="$HTTPS_PROXY"
export HTTP_PROXY="$HTTP_PROXY"
export NO_PROXY="$NO_PROXY"

# Run a quick test
echo "🚀 Starting parsing test..."
timeout 30s npm run parse 2>&1 | head -n 20 || echo "⏰ Test timed out after 30 seconds"

echo ""
echo "🎉 Proxy testing complete!"
echo ""
echo "📋 Summary:"
echo "📍 Country: $COUNTRY"
echo "🏙️ City: $CITY"
echo "🌐 IP: $IP"
echo "🌐 Proxy: $PROXY_URL"

