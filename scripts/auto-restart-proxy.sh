#!/bin/bash

# Auto-restart Groq Proxy Server Script
# This script ensures the Groq proxy server is always running and restarts it if it fails

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROXY_NAME="groq-proxy"
PROXY_PORT="8787"
PROXY_HEALTH_URL="http://localhost:${PROXY_PORT}/healthz"
MAX_RESTART_ATTEMPTS=5
RESTART_DELAY=10
HEALTH_CHECK_TIMEOUT=30

# Logging
LOG_FILE="/var/www/marinaobuv/logs/proxy-auto-restart.log"
mkdir -p "$(dirname "$LOG_FILE")" || true

# Function to print colored output
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

# Function to check if proxy is running in PM2
check_pm2_status() {
    if pm2 list | grep -q "${PROXY_NAME}.*online"; then
        return 0
    else
        return 1
    fi
}

# Function to check if proxy is responding to health checks
check_proxy_health() {
    if timeout $HEALTH_CHECK_TIMEOUT curl -f -s "$PROXY_HEALTH_URL" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to start proxy server
start_proxy() {
    log_info "Starting ${PROXY_NAME} server..."
    
    # Navigate to project directory
    cd /var/www/marinaobuv || { log_error "Cannot navigate to /var/www/marinaobuv"; return 1; }
    
    # Start proxy using ecosystem config
    if pm2 start ecosystem.config.js --only ${PROXY_NAME} --env production; then
        log_success "${PROXY_NAME} started successfully"
        return 0
    else
        log_error "Failed to start ${PROXY_NAME}"
        return 1
    fi
}

# Function to restart proxy server
restart_proxy() {
    log_info "Restarting ${PROXY_NAME} server..."
    
    # Stop existing instance
    pm2 delete ${PROXY_NAME} 2>/dev/null || true
    
    # Wait a moment
    sleep 2
    
    # Start new instance
    if start_proxy; then
        log_success "${PROXY_NAME} restarted successfully"
        return 0
    else
        log_error "Failed to restart ${PROXY_NAME}"
        return 1
    fi
}

# Function to wait for proxy to be healthy
wait_for_health() {
    local max_wait=60
    local wait_time=0
    
    log_info "Waiting for ${PROXY_NAME} to become healthy..."
    
    while [ $wait_time -lt $max_wait ]; do
        if check_proxy_health; then
            log_success "${PROXY_NAME} is healthy"
            return 0
        fi
        
        sleep 2
        wait_time=$((wait_time + 2))
    done
    
    log_warning "${PROXY_NAME} did not become healthy within ${max_wait} seconds"
    return 1
}

# Function to perform comprehensive health check
comprehensive_health_check() {
    local pm2_ok=false
    local health_ok=false
    
    # Check PM2 status
    if check_pm2_status; then
        pm2_ok=true
        log_info "PM2 status: OK"
    else
        log_warning "PM2 status: FAILED"
    fi
    
    # Check health endpoint
    if check_proxy_health; then
        health_ok=true
        log_info "Health endpoint: OK"
    else
        log_warning "Health endpoint: FAILED"
    fi
    
    # Return success only if both checks pass
    if [ "$pm2_ok" = true ] && [ "$health_ok" = true ]; then
        return 0
    else
        return 1
    fi
}

# Function to attempt recovery
attempt_recovery() {
    local attempt=1
    
    log_info "Attempting to recover ${PROXY_NAME}..."
    
    while [ $attempt -le $MAX_RESTART_ATTEMPTS ]; do
        log_info "Recovery attempt $attempt/$MAX_RESTART_ATTEMPTS"
        
        if restart_proxy; then
            # Wait for health
            if wait_for_health; then
                log_success "Recovery successful on attempt $attempt"
                return 0
            fi
        fi
        
        log_warning "Recovery attempt $attempt failed"
        attempt=$((attempt + 1))
        
        if [ $attempt -le $MAX_RESTART_ATTEMPTS ]; then
            log_info "Waiting ${RESTART_DELAY} seconds before next attempt..."
            sleep $RESTART_DELAY
        fi
    done
    
    log_error "All recovery attempts failed"
    return 1
}

# Function to send alert (placeholder for future notification system)
send_alert() {
    local message="$1"
    log_error "ALERT: $message"
    # TODO: Add email/SMS/Slack notification here
}

# Main function
main() {
    log_info "🔍 Starting ${PROXY_NAME} health check and auto-restart..."
    
    # Perform comprehensive health check
    if comprehensive_health_check; then
        log_success "🎉 ${PROXY_NAME} is healthy and running properly"
        exit 0
    fi
    
    log_warning "⚠️ ${PROXY_NAME} health check failed, attempting recovery..."
    
    # Attempt recovery
    if attempt_recovery; then
        log_success "🎉 ${PROXY_NAME} recovery successful!"
        exit 0
    else
        log_error "❌ ${PROXY_NAME} recovery failed after $MAX_RESTART_ATTEMPTS attempts"
        send_alert "${PROXY_NAME} server is down and recovery failed"
        exit 1
    fi
}

# Handle command line arguments
case "${1:-}" in
    "check")
        log_info "Performing health check only..."
        if comprehensive_health_check; then
            log_success "Health check passed"
            exit 0
        else
            log_error "Health check failed"
            exit 1
        fi
        ;;
    "restart")
        log_info "Force restarting ${PROXY_NAME}..."
        if restart_proxy && wait_for_health; then
            log_success "Force restart successful"
            exit 0
        else
            log_error "Force restart failed"
            exit 1
        fi
        ;;
    "start")
        log_info "Starting ${PROXY_NAME}..."
        if start_proxy && wait_for_health; then
            log_success "Start successful"
            exit 0
        else
            log_error "Start failed"
            exit 1
        fi
        ;;
    "status")
        log_info "Checking ${PROXY_NAME} status..."
        if comprehensive_health_check; then
            log_success "Status: HEALTHY"
            exit 0
        else
            log_error "Status: UNHEALTHY"
            exit 1
        fi
        ;;
    *)
        main
        ;;
esac
