#!/bin/bash

# Quick Fix Groq Proxy Script
# Run this script on the server to quickly fix groq-proxy issues

set -e

echo "🔧 Quick fixing groq-proxy..."

# Navigate to application directory
cd /var/www/marinaobuv

# Stop all PM2 processes
echo "🛑 Stopping all PM2 processes..."
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
sleep 3

# Install proxy dependencies
echo "📦 Installing proxy dependencies..."
cd proxy
npm install
cd ..

# Start PM2 with ecosystem config
echo "🚀 Starting PM2..."
pm2 start ecosystem.config.js --env production

# Wait and check status
sleep 10
echo "📊 PM2 Status:"
pm2 status

# Test groq-proxy
echo "🔍 Testing groq-proxy..."
if curl -f -s http://localhost:3001/healthz > /dev/null 2>&1; then
    echo "✅ Groq-proxy is working on port 3001"
elif curl -f -s http://localhost:8787/healthz > /dev/null 2>&1; then
    echo "✅ Groq-proxy is working on port 8787"
else
    echo "❌ Groq-proxy is not responding"
    echo "📋 Groq-proxy logs:"
    pm2 logs groq-proxy --lines 10
fi

# Save PM2 config
pm2 save

echo "🎉 Quick fix completed!"
