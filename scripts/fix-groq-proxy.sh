#!/bin/bash

# Fix Groq Proxy Script
# This script fixes groq-proxy startup issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "🔧 Fixing groq-proxy issues..."

# Navigate to application directory
cd /var/www/marinaobuv || { print_error "Cannot navigate to /var/www/marinaobuv"; exit 1; }

# Check current PM2 status
print_status "📊 Current PM2 status:"
pm2 status

# Stop and clean up all PM2 processes
print_status "🛑 Stopping all PM2 processes..."
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
sleep 3

# Install proxy dependencies
print_status "📦 Installing proxy dependencies..."
cd proxy
if npm install; then
    print_success "Proxy dependencies installed successfully"
else
    print_error "Failed to install proxy dependencies"
    exit 1
fi
cd ..

# Check if proxy server.js exists and is executable
print_status "🔍 Checking proxy server file..."
if [ -f "proxy/server.js" ]; then
    print_success "Proxy server.js found"
    ls -la proxy/server.js
else
    print_error "Proxy server.js not found!"
    exit 1
fi

# Test proxy server directly
print_status "🧪 Testing proxy server directly..."
cd proxy
if timeout 10s node server.js &
PROXY_PID=$!
sleep 5

# Check if proxy is responding
if curl -f -s http://localhost:3001/healthz > /dev/null 2>&1; then
    print_success "Proxy server is responding on port 3001"
    kill $PROXY_PID 2>/dev/null || true
else
    print_warning "Proxy server not responding on port 3001, trying port 8787..."
    if curl -f -s http://localhost:8787/healthz > /dev/null 2>&1; then
        print_success "Proxy server is responding on port 8787"
        kill $PROXY_PID 2>/dev/null || true
    else
        print_error "Proxy server not responding on any port"
        kill $PROXY_PID 2>/dev/null || true
        exit 1
    fi
fi
cd ..

# Start PM2 with ecosystem config
print_status "🚀 Starting PM2 with ecosystem configuration..."
if pm2 start ecosystem.config.js --env production; then
    print_success "PM2 started successfully"
else
    print_error "Failed to start PM2"
    exit 1
fi

# Wait for processes to start
print_status "⏳ Waiting for processes to start..."
sleep 10

# Check PM2 status
print_status "📊 PM2 status after startup:"
pm2 status

# Check if groq-proxy is running
if pm2 list | grep -q "groq-proxy.*online"; then
    print_success "Groq-proxy is running in PM2"
else
    print_error "Groq-proxy is not running in PM2"
    print_status "Checking groq-proxy logs..."
    pm2 logs groq-proxy --lines 20
    exit 1
fi

# Test groq-proxy health endpoint
print_status "🔍 Testing groq-proxy health endpoint..."
if curl -f -s http://localhost:3001/healthz > /dev/null 2>&1; then
    print_success "Groq-proxy health check passed on port 3001"
elif curl -f -s http://localhost:8787/healthz > /dev/null 2>&1; then
    print_success "Groq-proxy health check passed on port 8787"
    print_warning "Proxy is running on port 8787 instead of 3001"
else
    print_error "Groq-proxy health check failed on both ports"
    print_status "Checking groq-proxy logs..."
    pm2 logs groq-proxy --lines 20
    exit 1
fi

# Save PM2 configuration
print_status "💾 Saving PM2 configuration..."
pm2 save

print_success "🎉 Groq-proxy fix completed successfully!"
print_status "Groq-proxy should now be working properly."
