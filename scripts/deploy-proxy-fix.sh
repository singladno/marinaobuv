#!/bin/bash

# Quick deployment script to fix proxy server issues
# This script can be run to quickly deploy the proxy server fix

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

print_status "🚀 Deploying proxy server fix..."

# 1. Stop existing proxy if running
print_status "Stopping existing proxy server..."
pm2 delete groq-proxy 2>/dev/null || true

# 2. Start proxy server with new configuration
print_status "Starting proxy server with PM2..."
pm2 start ecosystem.config.js --only groq-proxy --env production

# 3. Save PM2 configuration
print_status "Saving PM2 configuration..."
pm2 save

# 4. Wait for startup
print_status "Waiting for proxy server to start..."
sleep 5

# 5. Verify proxy server is running
print_status "Verifying proxy server status..."
if pm2 list | grep -q "groq-proxy.*online"; then
    print_success "Proxy server is running in PM2"
else
    print_error "Proxy server failed to start"
    exit 1
fi

# 6. Test health endpoint
print_status "Testing proxy server health endpoint..."
if curl -f -s http://localhost:8787/healthz > /dev/null 2>&1; then
    print_success "Proxy server health check passed"
else
    print_warning "Proxy server health check failed (may still be starting)"
fi

# 7. Test Groq connectivity if API key is available
if [ -n "$GROQ_API_KEY" ]; then
    print_status "Testing Groq API connectivity..."
    if curl -f -s -H "Authorization: Bearer ${GROQ_API_KEY}" \
        http://localhost:8787/openai/v1/models > /dev/null 2>&1; then
        print_success "Groq API connectivity test passed"
    else
        print_warning "Groq API connectivity test failed"
    fi
else
    print_warning "GROQ_API_KEY not set, skipping connectivity test"
fi

print_success "🎉 Proxy server fix deployed successfully!"
print_status ""
print_status "Useful commands:"
print_status "  Check status: pm2 status"
print_status "  View logs: pm2 logs groq-proxy"
print_status "  Restart: pm2 restart groq-proxy"
print_status "  Health check: ./scripts/check-proxy-health.sh"
print_status "  Full verification: ./scripts/verify-deployment.sh"
