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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
NGINX_CONF_SRC="$REPO_ROOT/nginx/conf.d"
STAMP="$(date +%Y%m%d_%H%M%S)"
# Copy only HTTP config from repo. Do NOT copy marinaobuv-https.conf (repo has self-signed paths; server may have Let's Encrypt from certbot).
# HTTPS config is written by blue-green-deploy.sh with LE paths when available.
DEPLOY_CONFS="marinaobuv.conf"

if [ -f "$NGINX_CONF_SRC/marinaobuv.conf" ]; then
    print_status "Deploying HTTP nginx config from repo (HTTPS left to blue-green / certbot on server)..."
    # Remove Docker-only config if present (uses upstream "web", breaks PM2 server)
    if [ -f /etc/nginx/conf.d/marinaobuv-http.conf ]; then
        sudo rm -f /etc/nginx/conf.d/marinaobuv-http.conf
        print_status "  removed marinaobuv-http.conf (Docker-only, not used here)"
    fi
    # Backup and copy HTTP config only
    for name in $DEPLOY_CONFS; do
        if [ -f "/etc/nginx/conf.d/$name" ]; then
            sudo cp "/etc/nginx/conf.d/$name" "/etc/nginx/conf.d/${name}.backup.$STAMP" || true
        fi
        sudo cp "$NGINX_CONF_SRC/$name" "/etc/nginx/conf.d/$name"
        print_status "  -> $name"
    done

    # marinaobuv-https.conf uses zone=admin_api for /api/admin/ — ensure main nginx.conf defines it
    if [ -f /etc/nginx/nginx.conf ] && ! sudo grep -q 'zone=admin_api' /etc/nginx/nginx.conf 2>/dev/null; then
        print_status "Adding admin_api limit_req_zone to /etc/nginx/nginx.conf (required for /api/admin/)..."
        if sudo grep -q 'limit_req_zone.*zone=api:10m' /etc/nginx/nginx.conf 2>/dev/null; then
            sudo sed -i '/limit_req_zone.*zone=api:10m/a\    limit_req_zone $binary_remote_addr zone=admin_api:10m rate=120r/s;' /etc/nginx/nginx.conf
        else
            print_warning "Could not find api limit_req_zone line — add admin_api zone manually or sync nginx/nginx.conf from repo"
        fi
    fi

    print_status "Testing nginx configuration..."
    if ! sudo nginx -t 2>/dev/null; then
        print_error "Nginx configuration test failed after copy - rolling back to keep site up"
        for name in $DEPLOY_CONFS; do
            if [ -f "/etc/nginx/conf.d/${name}.backup.$STAMP" ]; then
                sudo mv "/etc/nginx/conf.d/${name}.backup.$STAMP" "/etc/nginx/conf.d/$name"
                print_status "  restored $name"
            fi
        done
        sudo systemctl reload nginx 2>/dev/null || true
        print_error "Deploy nginx config aborted. Fix repo config and redeploy, or fix nginx on server manually."
        exit 1
    fi
else
    print_status "Repo nginx configs not found - writing HTTP-only fallback to marinaobuv.conf..."
    if [ -f "/etc/nginx/conf.d/marinaobuv.conf" ]; then
        sudo cp /etc/nginx/conf.d/marinaobuv.conf /etc/nginx/conf.d/marinaobuv.conf.backup.$STAMP || true
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
        proxy_pass http://127.0.0.1:3000;
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
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files with caching
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
        expires 1y;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:3000/api/health;
        access_log off;
    }
}
EOF
    print_status "Testing nginx configuration..."
    if ! sudo nginx -t; then
        if [ -f "/etc/nginx/conf.d/marinaobuv.conf.backup.$STAMP" ]; then
            sudo mv "/etc/nginx/conf.d/marinaobuv.conf.backup.$STAMP" /etc/nginx/conf.d/marinaobuv.conf
            sudo systemctl reload nginx 2>/dev/null || true
        fi
        print_error "Nginx configuration test failed"
        exit 1
    fi
fi

# Ensure main nginx.conf logs upstream_status (Yandex / 502 correlation). Idempotent.
INJECT_PY="$SCRIPT_DIR/inject-nginx-with-upstream.py"
if [ -f /etc/nginx/nginx.conf ] && ! sudo grep -q 'log_format with_upstream' /etc/nginx/nginx.conf 2>/dev/null; then
    print_status "Adding log_format with_upstream to /etc/nginx/nginx.conf..."
    STAMP_MAIN="$(date +%Y%m%d_%H%M%S)"
    sudo cp /etc/nginx/nginx.conf "/etc/nginx/nginx.conf.backup.with_upstream.$STAMP_MAIN"
    if [ ! -f "$INJECT_PY" ]; then
        print_warning "inject-nginx-with-upstream.py missing — copy log_format from nginx/nginx.conf manually"
    elif sudo python3 "$INJECT_PY"; then
        if ! sudo nginx -t 2>/dev/null; then
            print_error "nginx -t failed after with_upstream inject — restoring backup"
            sudo mv "/etc/nginx/nginx.conf.backup.with_upstream.$STAMP_MAIN" /etc/nginx/nginx.conf
            exit 1
        fi
        print_success "with_upstream log_format added (backup: /etc/nginx/nginx.conf.backup.with_upstream.$STAMP_MAIN)"
    else
        ec=$?
        if [ "$ec" = 2 ]; then
            print_warning "Could not inject with_upstream (no default_type line?) — merge from repo nginx/nginx.conf manually"
            sudo mv "/etc/nginx/nginx.conf.backup.with_upstream.$STAMP_MAIN" /etc/nginx/nginx.conf 2>/dev/null || true
        else
            print_error "inject-nginx-with-upstream.py failed"
            sudo mv "/etc/nginx/nginx.conf.backup.with_upstream.$STAMP_MAIN" /etc/nginx/nginx.conf 2>/dev/null || true
            exit 1
        fi
    fi
fi

print_status "Reloading nginx..."
if sudo systemctl reload nginx; then
    print_success "Nginx reloaded successfully"
else
    print_error "Failed to reload nginx"
    exit 1
fi

print_success "🎉 Nginx configuration fixed successfully!"
