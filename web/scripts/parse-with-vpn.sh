#!/bin/bash

# Parse messages with VPN enabled
echo "🚀 Starting parsing with VPN..."

# Start VPN
echo "📡 Starting VPN..."
./scripts/start-vpn.sh

if [ $? -ne 0 ]; then
    echo "❌ Failed to start VPN"
    exit 1
fi

# Wait a moment for VPN to stabilize
sleep 2

# Run the parser
echo "🧪 Running parser with VPN..."
source .env && tsx src/scripts/fetch-messages-green-api-advanced.ts

# Check if parser succeeded
if [ $? -eq 0 ]; then
    echo "✅ Parser completed successfully!"
    
    # Run product processing
    echo "🔄 Processing products..."
    source .env && tsx src/scripts/process-draft-products-unified.ts
    
    if [ $? -eq 0 ]; then
        echo "✅ Product processing completed!"
    else
        echo "❌ Product processing failed"
    fi
else
    echo "❌ Parser failed"
fi

# Stop VPN
echo "🛑 Stopping VPN..."
./scripts/stop-vpn.sh

echo "🎉 Parsing with VPN complete!"
