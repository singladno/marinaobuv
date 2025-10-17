#!/bin/bash

# Test Groq Proxy Connection Script
# This script tests the connection to the Groq proxy server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROXY_HOST="31.44.2.216"
PROXY_PORT="8787"
PROXY_URL="http://${PROXY_HOST}:${PROXY_PORT}"

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

# Function to test basic connectivity
test_connectivity() {
    log_info "Testing basic connectivity to ${PROXY_HOST}:${PROXY_PORT}..."
    
    if timeout 10 nc -z "${PROXY_HOST}" "${PROXY_PORT}" 2>/dev/null; then
        log_success "Port ${PROXY_PORT} is open on ${PROXY_HOST}"
        return 0
    else
        log_error "Cannot connect to ${PROXY_HOST}:${PROXY_PORT}"
        return 1
    fi
}

# Function to test HTTP response
test_http_response() {
    log_info "Testing HTTP response from proxy server..."
    
    if timeout 10 curl -f -s "${PROXY_URL}/healthz" > /dev/null 2>&1; then
        log_success "Proxy server is responding to HTTP requests"
        return 0
    else
        log_error "Proxy server is not responding to HTTP requests"
        return 1
    fi
}

# Function to test Groq API through proxy
test_groq_api() {
    log_info "Testing Groq API through proxy..."
    
    if [ -z "$GROQ_API_KEY" ]; then
        log_warning "GROQ_API_KEY not set, skipping API test"
        return 0
    fi
    
    if timeout 30 curl -f -s -H "Authorization: Bearer ${GROQ_API_KEY}" \
        "${PROXY_URL}/openai/v1/models" > /dev/null 2>&1; then
        log_success "Groq API is accessible through proxy"
        return 0
    else
        log_error "Groq API is not accessible through proxy"
        return 1
    fi
}

# Function to show proxy status
show_proxy_status() {
    log_info "Proxy server status:"
    echo "  Host: ${PROXY_HOST}"
    echo "  Port: ${PROXY_PORT}"
    echo "  URL: ${PROXY_URL}"
    echo "  Health endpoint: ${PROXY_URL}/healthz"
    echo ""
}

# Function to show troubleshooting steps
show_troubleshooting() {
    log_info "Troubleshooting steps:"
    echo "1. Check if proxy server is running on the server:"
    echo "   ssh ubuntu@31.44.2.216 'pm2 list | grep groq-proxy'"
    echo ""
    echo "2. Check proxy server logs:"
    echo "   ssh ubuntu@31.44.2.216 'pm2 logs groq-proxy'"
    echo ""
    echo "3. Restart proxy server:"
    echo "   ssh ubuntu@31.44.2.216 'pm2 restart groq-proxy'"
    echo ""
    echo "4. Check if port 8787 is open:"
    echo "   ssh ubuntu@31.44.2.216 'sudo netstat -tlnp | grep 8787'"
    echo ""
    echo "5. Check firewall settings:"
    echo "   ssh ubuntu@31.44.2.216 'sudo ufw status'"
    echo ""
    echo "6. Test locally on server:"
    echo "   ssh ubuntu@31.44.2.216 'curl -f http://localhost:8787/healthz'"
}

# Main function
main() {
    log_info "🔍 Testing Groq proxy connection..."
    echo ""
    
    show_proxy_status
    
    local connectivity_ok=false
    local http_ok=false
    local api_ok=false
    
    # Test connectivity
    if test_connectivity; then
        connectivity_ok=true
    fi
    
    # Test HTTP response
    if test_http_response; then
        http_ok=true
    fi
    
    # Test Groq API
    if test_groq_api; then
        api_ok=true
    fi
    
    echo ""
    log_info "Test Results Summary:"
    echo "  Connectivity: $([ "$connectivity_ok" = true ] && echo "✅ PASS" || echo "❌ FAIL")"
    echo "  HTTP Response: $([ "$http_ok" = true ] && echo "✅ PASS" || echo "❌ FAIL")"
    echo "  Groq API: $([ "$api_ok" = true ] && echo "✅ PASS" || echo "❌ FAIL")"
    echo ""
    
    # Determine overall status
    if [ "$connectivity_ok" = true ] && [ "$http_ok" = true ] && [ "$api_ok" = true ]; then
        log_success "🎉 All tests passed! Proxy server is working correctly."
        exit 0
    else
        log_error "❌ Some tests failed. Proxy server may not be working correctly."
        echo ""
        show_troubleshooting
        exit 1
    fi
}

# Handle command line arguments
case "${1:-}" in
    "connectivity")
        test_connectivity
        ;;
    "http")
        test_http_response
        ;;
    "api")
        test_groq_api
        ;;
    "status")
        show_proxy_status
        ;;
    "troubleshoot")
        show_troubleshooting
        ;;
    *)
        main
        ;;
esac
