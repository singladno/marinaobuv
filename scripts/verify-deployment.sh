#!/bin/bash

# Comprehensive deployment verification script
# Checks all critical services and components

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

# Check PM2 services
check_pm2_services() {
    log_info "Checking PM2 services..."
    
    local all_ok=true
    
    # Check main application
    if pm2 list | grep -q "marinaobuv.*online"; then
        log_success "Main application (marinaobuv) is running"
    else
        log_error "Main application (marinaobuv) is not running"
        all_ok=false
    fi
    
    # Check proxy server
    if pm2 list | grep -q "groq-proxy.*online"; then
        log_success "Groq proxy server is running"
    else
        log_error "Groq proxy server is not running"
        all_ok=false
    fi
    
    if [ "$all_ok" = true ]; then
        return 0
    else
        return 1
    fi
}

# Check application health
check_application_health() {
    log_info "Checking application health..."
    
    local all_ok=true
    
    # Check main application
    if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
        log_success "Main application health check passed"
    else
        log_error "Main application health check failed"
        all_ok=false
    fi
    
    # Check proxy server
    if curl -f -s http://localhost:8787/healthz > /dev/null 2>&1; then
        log_success "Groq proxy server health check passed"
    else
        log_error "Groq proxy server health check failed"
        all_ok=false
    fi
    
    if [ "$all_ok" = true ]; then
        return 0
    else
        return 1
    fi
}

# Check webhook endpoint
check_webhook_endpoint() {
    log_info "Checking WhatsApp webhook endpoint..."
    
    if curl -f -s https://marina-obuv.ru/api/webhooks/green-api > /dev/null 2>&1; then
        log_success "WhatsApp webhook endpoint is accessible"
        return 0
    else
        log_error "WhatsApp webhook endpoint is not accessible"
        return 1
    fi
}

# Check database connectivity
check_database() {
    log_info "Checking database connectivity..."
    
    if sudo -u postgres psql -c "SELECT 1;" > /dev/null 2>&1; then
        log_success "PostgreSQL database is accessible"
        return 0
    else
        log_error "PostgreSQL database is not accessible"
        return 1
    fi
}

# Check Nginx
check_nginx() {
    log_info "Checking Nginx..."
    
    if sudo systemctl is-active --quiet nginx; then
        log_success "Nginx is running"
        return 0
    else
        log_error "Nginx is not running"
        return 1
    fi
}

# Check system resources
check_system_resources() {
    log_info "Checking system resources..."
    
    # Check disk space
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -lt 90 ]; then
        log_success "Disk usage is healthy: ${disk_usage}%"
    else
        log_warning "Disk usage is high: ${disk_usage}%"
    fi
    
    # Check memory
    local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ "$memory_usage" -lt 90 ]; then
        log_success "Memory usage is healthy: ${memory_usage}%"
    else
        log_warning "Memory usage is high: ${memory_usage}%"
    fi
    
    return 0
}

# Check logs for errors
check_logs() {
    log_info "Checking recent logs for errors..."
    
    local error_count=0
    
    # Check main application logs
    if pm2 logs marinaobuv --lines 50 2>/dev/null | grep -i "error\|exception\|failed" | wc -l | grep -q "^0$"; then
        log_success "No recent errors in main application logs"
    else
        log_warning "Found errors in main application logs"
        error_count=$((error_count + 1))
    fi
    
    # Check proxy server logs
    if pm2 logs groq-proxy --lines 50 2>/dev/null | grep -i "error\|exception\|failed" | wc -l | grep -q "^0$"; then
        log_success "No recent errors in proxy server logs"
    else
        log_warning "Found errors in proxy server logs"
        error_count=$((error_count + 1))
    fi
    
    if [ "$error_count" -eq 0 ]; then
        return 0
    else
        return 1
    fi
}

# Main verification function
main() {
    log_info "🔍 Starting comprehensive deployment verification..."
    echo ""
    
    local overall_status=0
    
    # Run all checks
    check_pm2_services || overall_status=1
    echo ""
    
    check_application_health || overall_status=1
    echo ""
    
    check_webhook_endpoint || overall_status=1
    echo ""
    
    check_database || overall_status=1
    echo ""
    
    check_nginx || overall_status=1
    echo ""
    
    check_system_resources
    echo ""
    
    check_logs || overall_status=1
    echo ""
    
    # Final status
    if [ "$overall_status" -eq 0 ]; then
        log_success "🎉 All deployment verification checks passed!"
        log_info "System is fully operational and ready for production use."
        exit 0
    else
        log_error "❌ Some deployment verification checks failed!"
        log_info "Please review the failed checks above and take appropriate action."
        exit 1
    fi
}

# Run main function
main "$@"
