#!/bin/bash

# Start VPN for OpenAI access
echo "🔧 Starting VPN for OpenAI access..."

# Check if WireGuard is installed
if ! command -v wg &> /dev/null; then
    echo "❌ WireGuard not installed. Please install it first:"
    echo "   brew install wireguard-tools"
    exit 1
fi

# Check if VPN config exists
if [ ! -f "/etc/wireguard/wg0.conf" ]; then
    echo "📝 Creating VPN config from local files..."
    
    # Check if local config exists
    if [ -f "../vpn-test/server.conf" ]; then
        echo "📋 Using local VPN config..."
        sudo cp ../vpn-test/server.conf /etc/wireguard/wg0.conf
    else
        echo "❌ VPN config not found at /etc/wireguard/wg0.conf or ../vpn-test/server.conf"
        echo "   Please run the VPN setup first"
        exit 1
    fi
fi

# Start WireGuard
echo "📡 Starting WireGuard..."
sudo wg-quick up wg0

# Wait for connection
sleep 3

# Test connection
echo "🧪 Testing VPN connection..."
ping -c 3 10.0.0.1 > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ VPN connected successfully!"
    echo "📊 WireGuard status:"
    sudo wg show
else
    echo "❌ VPN connection failed"
    exit 1
fi
