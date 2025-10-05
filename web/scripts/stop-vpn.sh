#!/bin/bash

# Stop VPN
echo "🛑 Stopping VPN..."

# Stop WireGuard
sudo wg-quick down wg0

echo "✅ VPN stopped!"
