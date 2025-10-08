#!/bin/bash

# Local webhook test script
# This script tests the webhook endpoint locally before deployment

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

# Function to test webhook endpoint locally
test_local_webhook() {
    log_info "Testing local webhook endpoint..."
    
    # Check if the webhook route file exists
    if [ ! -f "web/src/app/api/webhooks/green-api/route.ts" ]; then
        log_error "Webhook route file not found!"
        return 1
    fi
    
    log_success "Webhook route file exists"
    
    # Test if the application is running locally
    if curl -f -s http://localhost:3000/api/webhooks/green-api > /dev/null 2>&1; then
        log_success "Local webhook endpoint is responding"
        return 0
    else
        log_warning "Local webhook endpoint not responding (app might not be running)"
        log_info "To test locally, run: cd web && npm run dev"
        return 1
    fi
}

# Function to check webhook route structure
check_webhook_structure() {
    log_info "Checking webhook route structure..."
    
    # Check for correct directory structure
    if [ -d "web/src/app/api/webhooks/green-api" ]; then
        log_success "Webhook directory structure is correct"
    else
        log_error "Webhook directory structure is incorrect"
        return 1
    fi
    
    # Check for route.ts file
    if [ -f "web/src/app/api/webhooks/green-api/route.ts" ]; then
        log_success "Route file exists"
    else
        log_error "Route file missing"
        return 1
    fi
    
    # Check for conflicting files
    if [ -f "web/src/app/api/webhooks/green-api.ts" ]; then
        log_warning "Found conflicting webhook file, this should be removed"
        return 1
    fi
    
    log_success "No conflicting files found"
    return 0
}

# Main function
main() {
    log_info "🔍 Testing webhook setup locally..."
    
    # Check webhook structure
    if ! check_webhook_structure; then
        log_error "Webhook structure check failed"
        exit 1
    fi
    
    # Test local endpoint (optional)
    if test_local_webhook; then
        log_success "🎉 Local webhook test passed!"
    else
        log_warning "Local webhook test failed (app might not be running)"
        log_info "This is normal if the app is not running locally"
    fi
    
    log_success "✅ Webhook setup verification completed!"
}

# Run main function
main "$@"
