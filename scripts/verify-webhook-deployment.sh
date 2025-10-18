#!/bin/bash

# Webhook Deployment Verification Script
# This script ensures the webhook endpoint is working after deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to test webhook endpoint
test_webhook_endpoint() {
    local max_attempts=10
    local attempt=1
    
    log_info "Testing webhook endpoint..."
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Attempt $attempt/$max_attempts..."
        
        # Test local endpoint first
        if curl -f -s http://localhost:3000/api/webhooks/green-api > /dev/null 2>&1; then
            log_success "Local webhook endpoint is responding"
            return 0
        fi
        
        # Test external endpoint
        if curl -f -s https://marina-obuv.ru/api/webhooks/green-api > /dev/null 2>&1; then
            log_success "External webhook endpoint is responding"
            return 0
        fi
        
        log_warning "Webhook not responding, waiting 10 seconds..."
        sleep 10
        ((attempt++))
    done
    
    log_error "Webhook endpoint failed to respond after $max_attempts attempts"
    return 1
}

# Function to check application status
check_application_status() {
    log_info "Checking application status..."
    
    # Check if PM2 process is running
    if pm2 list | grep -q "marinaobuv.*online"; then
        log_success "PM2 process is running"
    else
        log_error "PM2 process is not running"
        return 1
    fi
    
    # Note: Groq proxy runs on separate serverspace server (31.44.2.216)
    log_info "Note: Groq proxy runs on separate serverspace server"
    log_info "Proxy connectivity will be tested via nginx configuration"
    
    # Check if port 3000 is listening (prefer ss, fallback to netstat)
    if command -v ss >/dev/null 2>&1; then
        if ss -tlnp | grep -q ":3000"; then
            log_success "Port 3000 is listening"
        else
            log_error "Port 3000 is not listening"
            return 1
        fi
    elif command -v netstat >/dev/null 2>&1; then
        if netstat -tlnp | grep -q ":3000"; then
            log_success "Port 3000 is listening"
        else
            log_error "Port 3000 is not listening"
            return 1
        fi
    else
        log_warning "Neither ss nor netstat available to verify listening ports; skipping port check"
    fi
    
    return 0
}

# Note: Groq proxy runs on separate serverspace server (31.44.2.216)
# No local proxy startup needed

# Function to restart application if needed
restart_application() {
    log_info "Restarting application to fix webhook..."
    
    # Restart PM2 process
    pm2 restart marinaobuv
    
    # Wait for application to start
    log_info "Waiting for application to start..."
    sleep 15
    
    # Check if it's running
    if pm2 list | grep -q "marinaobuv.*online"; then
        log_success "Application restarted successfully"
        return 0
    else
        log_error "Application failed to restart"
        return 1
    fi
}

# Function to verify webhook route exists
verify_webhook_route() {
    log_info "Verifying webhook route file exists..."
    
    if [ -f "web/src/app/api/webhooks/green-api/route.ts" ]; then
        log_success "Webhook route file exists"
        return 0
    else
        log_error "Webhook route file not found"
        return 1
    fi
}

# Function to check for conflicting routes
check_conflicting_routes() {
    log_info "Checking for conflicting webhook routes..."
    
    # Check if old conflicting file exists
    if [ -f "web/src/app/api/webhooks/green-api.ts" ]; then
        log_warning "Found conflicting webhook file, removing..."
        rm -f "web/src/app/api/webhooks/green-api.ts"
        log_success "Conflicting file removed"
    fi
    
    return 0
}

# Function to regenerate Prisma client
regenerate_prisma_client() {
    log_info "Regenerating Prisma client..."
    
    cd web
    if ./prisma-server.sh npm run prisma:generate; then
        log_success "Prisma client regenerated"
        cd ..
        return 0
    else
        log_error "Prisma client regeneration failed"
        cd ..
        return 1
    fi
}

# Main verification function
main() {
    log_info "🔍 Starting webhook deployment verification..."
    
    # Step 1: Check application status
    if ! check_application_status; then
        log_error "Application is not running properly"
        
        # Note: Groq proxy runs on separate serverspace server (31.44.2.216)
        log_info "Note: Groq proxy runs on separate serverspace server"
        log_info "Application should work without local proxy"
        exit 1
    fi
    
    # Step 2: Verify webhook route exists
    if ! verify_webhook_route; then
        log_error "Webhook route file is missing"
        exit 1
    fi
    
    # Step 3: Check for conflicting routes
    check_conflicting_routes
    
    # Step 4: Regenerate Prisma client
    regenerate_prisma_client
    
    # Step 5: Test webhook endpoint
    if test_webhook_endpoint; then
        log_success "🎉 Webhook endpoint is working correctly!"
        return 0
    else
        log_warning "Webhook endpoint not responding, attempting restart..."
        
        # Step 6: Restart application
        if restart_application; then
            # Step 7: Test again after restart
            if test_webhook_endpoint; then
                log_success "🎉 Webhook endpoint fixed after restart!"
                return 0
            else
                log_error "Webhook endpoint still not working after restart"
                return 1
            fi
        else
            log_error "Failed to restart application"
            return 1
        fi
    fi
}

# Run main function
main "$@"
