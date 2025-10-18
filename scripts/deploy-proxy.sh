#!/bin/bash

# Deploy Groq Proxy Server Script
# This script ensures proper deployment of the proxy server with conflict resolution

set -e

echo "🚀 Starting Groq Proxy Server Deployment..."

# Configuration
PROXY_DIR="/var/www/marinaobuv/proxy"
PROXY_NAME="groq-proxy"
PROXY_PORT="3001"
PROXY_TARGET="https://api.groq.com"

# Create proxy directory if it doesn't exist
sudo mkdir -p "$PROXY_DIR"

# Stop and remove any existing groq-proxy processes to prevent port conflicts
echo "🛑 Stopping existing groq-proxy processes..."
pm2 stop "$PROXY_NAME" 2>/dev/null || true
pm2 delete "$PROXY_NAME" 2>/dev/null || true

# Kill any processes using port 3001
echo "🔍 Checking for port conflicts on port $PROXY_PORT..."
if lsof -i :$PROXY_PORT >/dev/null 2>&1; then
    echo "⚠️  Port $PROXY_PORT is in use, killing existing processes..."
    sudo lsof -ti :$PROXY_PORT | xargs sudo kill -9 2>/dev/null || true
    sleep 2
fi

# Copy proxy server files
echo "📁 Copying proxy server files..."
sudo cp proxy/server.js "$PROXY_DIR/"
sudo cp proxy/package.json "$PROXY_DIR/" 2>/dev/null || true

# Set proper permissions
sudo chown -R ubuntu:ubuntu "$PROXY_DIR"
sudo chmod +x "$PROXY_DIR/server.js"

# Install dependencies if package.json exists
if [ -f "$PROXY_DIR/package.json" ]; then
    echo "📦 Installing proxy server dependencies..."
    cd "$PROXY_DIR"
    npm install --production
    cd - > /dev/null
fi

# Start the proxy server with PM2
echo "🚀 Starting groq-proxy with PM2..."
cd "$PROXY_DIR"
pm2 start server.js --name "$PROXY_NAME" --env production
cd - > /dev/null

# Save PM2 configuration
pm2 save

# Wait for server to start
echo "⏳ Waiting for proxy server to start..."
sleep 3

# Test the proxy server
echo "🧪 Testing proxy server..."
if curl -f http://localhost:$PROXY_PORT/healthz >/dev/null 2>&1; then
    echo "✅ Proxy server is running successfully!"
    echo "📊 Proxy server status:"
    pm2 status "$PROXY_NAME"
else
    echo "❌ Proxy server failed to start!"
    echo "📋 Proxy server logs:"
    pm2 logs "$PROXY_NAME" --lines 10
    exit 1
fi

echo "🎉 Groq Proxy Server deployment completed successfully!"
