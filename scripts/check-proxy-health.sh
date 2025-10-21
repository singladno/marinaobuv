#!/bin/bash

# Health check script for Groq proxy server
# This script can be used for monitoring and alerting

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if proxy server is running in PM2
check_pm2_status() {
    log_info "Checking PM2 status for groq-proxy..."
    
    if pm2 list | grep -q "groq-proxy.*online"; then
        log_success "Groq proxy is running in PM2"
        return 0
    else
        log_error "Groq proxy is not running in PM2"
        return 1
    fi
}

# Check if proxy server is responding to health checks
check_proxy_health() {
    log_info "Checking proxy server health endpoint..."
    
    if curl -f -s http://localhost:8787/healthz > /dev/null 2>&1; then
        log_success "Proxy server health check passed"
        return 0
    else
        log_error "Proxy server health check failed"
        return 1
    fi
}

# Check if proxy server can reach Groq API
check_groq_connectivity() {
    log_info "Testing Groq API connectivity through proxy..."
    
    # Test with a simple models request
    if curl -f -s -H "Authorization: Bearer ${GROQ_API_KEY}" \
        http://localhost:8787/openai/v1/models > /dev/null 2>&1; then
        log_success "Groq API connectivity test passed"
        return 0
    else
        log_warning "Groq API connectivity test failed (this may be expected if API key is not set)"
        return 1
    fi
}

# Restart proxy server if needed
restart_proxy() {
    log_info "Attempting to restart groq-proxy..."
    
    if pm2 restart groq-proxy; then
        log_success "Groq proxy restarted successfully"
        sleep 5  # Wait for startup
        return 0
    else
        log_error "Failed to restart groq-proxy"
        return 1
    fi
}

# Main health check function
main() {
    log_info "🔍 Starting Groq proxy health check..."
    
    local pm2_ok=false
    local health_ok=false
    local connectivity_ok=false
    
    # Check PM2 status
    if check_pm2_status; then
        pm2_ok=true
    fi
    
    # Check health endpoint
    if check_proxy_health; then
        health_ok=true
    fi
    
    # Check connectivity (optional)
    if [ -n "$GROQ_API_KEY" ]; then
        if check_groq_connectivity; then
            connectivity_ok=true
        fi
    else
        log_warning "GROQ_API_KEY not set, skipping connectivity test"
        connectivity_ok=true  # Don't fail if API key is not set
    fi
    
    # Determine overall status
    if [ "$pm2_ok" = true ] && [ "$health_ok" = true ] && [ "$connectivity_ok" = true ]; then
        log_success "🎉 All proxy health checks passed!"
        exit 0
    else
        log_error "❌ Proxy health checks failed!"
        
        # Try to restart if PM2 is not running
        if [ "$pm2_ok" = false ]; then
            log_info "Attempting to start groq-proxy..."
            if pm2 start ecosystem.config.js --only groq-proxy --env production; then
                log_success "Groq proxy started successfully"
                sleep 5
                # Re-check health
                if check_proxy_health; then
                    log_success "🎉 Proxy is now healthy after restart!"
                    exit 0
                fi
            fi
        fi
        
        exit 1
    fi
}

# Run main function
main "$@"
