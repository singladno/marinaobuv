#!/bin/bash

# Ensure Webhook Configuration Script
# This script ensures the Green API webhook is properly configured after deployments

set -euo pipefail

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

# Function to check if webhook is properly configured
check_webhook_status() {
    log_info "Checking current webhook configuration..."
    
    cd /var/www/marinaobuv/web
    if [ ! -f ".env" ]; then
        log_error "Environment file not found"
        return 1
    fi
    
    export $(grep -v '^#' .env | xargs)
    
    if [ -z "${GREEN_API_INSTANCE_ID:-}" ] || [ -z "${GREEN_API_TOKEN:-}" ]; then
        log_warning "Green API credentials not configured"
        return 1
    fi
    
    # Check current Green API settings
    local settings_response=$(curl -s "https://api.green-api.com/waInstance${GREEN_API_INSTANCE_ID}/getSettings/${GREEN_API_TOKEN}" || echo "{}")
    local incoming_webhook=$(echo "$settings_response" | jq -r '.incomingWebhook // "no"')
    local webhook_url=$(echo "$settings_response" | jq -r '.webhookUrl // ""')
    
    log_info "Current webhook status:"
    log_info "  incomingWebhook: $incoming_webhook"
    log_info "  webhookUrl: $webhook_url"
    
    if [ "$incoming_webhook" = "yes" ] && [ "$webhook_url" = "https://www.marina-obuv.ru/api/webhooks/green-api" ]; then
        log_success "Webhook is properly configured"
        return 0
    else
        log_warning "Webhook needs configuration"
        return 1
    fi
}

# Function to configure webhook
configure_webhook() {
    log_info "Configuring Green API webhook..."
    
    cd /var/www/marinaobuv/web
    export $(grep -v '^#' .env | xargs)
    
    if npx tsx src/scripts/configure-webhook.ts; then
        log_success "Webhook configuration completed"
        return 0
    else
        log_error "Webhook configuration failed"
        return 1
    fi
}

# Function to test webhook endpoint
test_webhook_endpoint() {
    log_info "Testing webhook endpoint..."
    
    local max_attempts=5
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Attempt $attempt/$max_attempts..."
        
        if curl -f -s https://marina-obuv.ru/api/webhooks/green-api > /dev/null 2>&1; then
            log_success "Webhook endpoint is responding"
            return 0
        fi
        
        log_warning "Webhook not responding, waiting 5 seconds..."
        sleep 5
        ((attempt++))
    done
    
    log_error "Webhook endpoint failed to respond after $max_attempts attempts"
    return 1
}

# Main function
main() {
    log_info "🔧 Ensuring webhook configuration..."
    
    # Check if webhook is already configured
    if check_webhook_status; then
        log_success "Webhook is already properly configured"
    else
        log_info "Webhook needs configuration, setting up..."
        if configure_webhook; then
            log_success "Webhook configured successfully"
        else
            log_error "Failed to configure webhook"
            exit 1
        fi
    fi
    
    # Test the webhook endpoint
    if test_webhook_endpoint; then
        log_success "🎉 Webhook is fully operational!"
        log_info "Target group: ${TARGET_GROUP_ID:-'Not configured'}"
        log_info "Ready to receive WhatsApp messages"
    else
        log_warning "Webhook endpoint test failed"
        log_info "The webhook may still work, but endpoint testing failed"
    fi
}

# Run main function
main "$@"
