#!/bin/bash

# Fix Nginx Configuration Script
# This script fixes nginx configuration issues during deployment

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

print_status "🔧 Fixing nginx configuration..."

# Repo root (parent of scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
NGINX_CONF_SRC="$REPO_ROOT/nginx/conf.d"

# Prefer repo nginx configs so deploy-from-push keeps client_max_body_size and HTTPS in sync
if [ -f "$NGINX_CONF_SRC/marinaobuv.conf" ]; then
    print_status "Using nginx configs from repo ($NGINX_CONF_SRC)..."
    for f in "$NGINX_CONF_SRC"/*.conf; do
        [ -f "$f" ] || continue
        name="$(basename "$f")"
        if [ -f "/etc/nginx/conf.d/$name" ]; then
            sudo cp "/etc/nginx/conf.d/$name" "/etc/nginx/conf.d/${name}.backup.$(date +%Y%m%d_%H%M%S)" || true
        fi
        sudo cp "$f" "/etc/nginx/conf.d/$name"
        print_status "  -> $name"
    done
else
    # Fallback: embedded config (e.g. script run outside repo)
    print_status "Repo nginx configs not found, using embedded configuration..."
    if [ -f "/etc/nginx/conf.d/marinaobuv.conf" ]; then
        sudo cp /etc/nginx/conf.d/marinaobuv.conf /etc/nginx/conf.d/marinaobuv.conf.backup.$(date +%Y%m%d_%H%M%S) || true
    fi
    sudo tee /etc/nginx/conf.d/marinaobuv.conf > /dev/null << 'EOF'
# HTTP server configuration for MarinaObuv
server {
    listen 80;
    server_name marina-obuv.ru www.marina-obuv.ru;

    client_max_body_size 20M;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Main application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
    }
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files with caching
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
        expires 1y;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3000/api/health;
        access_log off;
    }
}
EOF
fi

# Test nginx configuration
print_status "Testing nginx configuration..."
if sudo nginx -t; then
    print_success "Nginx configuration test passed"
else
    print_error "Nginx configuration test failed"
    exit 1
fi

# Reload nginx
print_status "Reloading nginx..."
if sudo systemctl reload nginx; then
    print_success "Nginx reloaded successfully"
else
    print_error "Failed to reload nginx"
    exit 1
fi

print_success "🎉 Nginx configuration fixed successfully!"
