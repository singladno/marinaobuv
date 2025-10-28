#!/bin/bash

# Blue-Green Zero-Downtime Deployment Script
# This script implements blue-green deployment to eliminate 502 errors

set -e

echo "🚀 Starting Blue-Green Zero-Downtime Deployment..."

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Load environment variables
if [ -f "web/.env" ]; then
    echo "🔧 Loading environment variables..."
    export $(cat web/.env | grep -v '^#' | xargs)
else
    echo "❌ Environment file not found: web/.env"
    exit 1
fi

# Function to get current active deployment
get_active_deployment() {
    # Check PM2 status to determine which deployment is running
    if pm2 list | grep -q "marinaobuv-blue.*online"; then
        echo "blue"
    elif pm2 list | grep -q "marinaobuv-green.*online"; then
        echo "green"
    else
        echo "none"
    fi
}

# Function to get inactive deployment
get_inactive_deployment() {
    local active=$(get_active_deployment)
    if [ "$active" = "blue" ]; then
        echo "green"
    elif [ "$active" = "green" ]; then
        echo "blue"
    else
        echo "blue"  # Default to blue if none is active
    fi
}

# Function to check if deployment is healthy
check_deployment_health() {
    local color=$1
    local port=$2
    
    echo "🏥 Checking health of $color deployment on port $port..."
    
    # Wait for service to start
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s http://localhost:$port/api/health > /dev/null 2>&1; then
            echo "✅ $color deployment is healthy"
            return 0
        fi
        
        echo "⏳ Health check attempt $attempt/$max_attempts for $color deployment..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ $color deployment failed health checks"
    return 1
}

# Function to switch nginx traffic
switch_nginx_traffic() {
    local target_color=$1
    local target_port=$2
    
    echo "🔄 Switching nginx traffic to $target_color deployment (port $target_port)..."
    
    # Update nginx configuration to point to the new deployment
    sudo tee /etc/nginx/conf.d/marinaobuv.conf > /dev/null << EOF
server {
    listen 80;
    server_name marina-obuv.ru www.marina-obuv.ru;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Main application - proxy to $target_color deployment
    location / {
        proxy_pass http://localhost:$target_port;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
    }
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:$target_port;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Static files with caching
    location /_next/static/ {
        proxy_pass http://localhost:$target_port;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
        expires 1y;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:$target_port/api/health;
        access_log off;
    }
}
EOF

    # Test nginx configuration
    if sudo nginx -t; then
        echo "✅ Nginx configuration test passed"
        # Reload nginx
        sudo systemctl reload nginx
        echo "✅ Traffic switched to $target_color deployment"
        return 0
    else
        echo "❌ Nginx configuration test failed!"
        return 1
    fi
}

# Function to stop inactive deployment
stop_inactive_deployment() {
    local inactive_color=$1
    
    echo "🛑 Stopping inactive $inactive_color deployment..."
    pm2 stop "marinaobuv-$inactive_color" 2>/dev/null || true
    pm2 delete "marinaobuv-$inactive_color" 2>/dev/null || true
    echo "✅ $inactive_color deployment stopped"
}

# Main deployment logic
main() {
    # Determine current and target deployments
    local current_active=$(get_active_deployment)
    local target_deployment=$(get_inactive_deployment)
    
    echo "📊 Current active deployment: $current_active"
    echo "🎯 Target deployment: $target_deployment"
    
    # Determine ports
    local target_port
    if [ "$target_deployment" = "blue" ]; then
        target_port=3000
    else
        target_port=3001
    fi
    
    # Build application (skip if already built)
    echo "🔨 Checking if application needs building..."
    if [ ! -f "web/.next/BUILD_ID" ]; then
        echo "🔨 Building application..."
        cd web
        npm run build
        cd ..
    else
        echo "✅ Application already built, skipping build step"
    fi
    
    # Start target deployment
    echo "🚀 Starting $target_deployment deployment on port $target_port..."
    pm2 start ecosystem-blue-green.config.js --only "marinaobuv-$target_deployment" --env production --update-env
    
    # Wait a moment for PM2 to start the process
    sleep 5
    
    # Wait for target deployment to be healthy
    if ! check_deployment_health "$target_deployment" "$target_port"; then
        echo "❌ Target deployment failed to become healthy"
        pm2 delete "marinaobuv-$target_deployment" 2>/dev/null || true
        exit 1
    fi
    
    # Switch nginx traffic to new deployment
    if ! switch_nginx_traffic "$target_deployment" "$target_port"; then
        echo "❌ Failed to switch traffic to new deployment"
        pm2 delete "marinaobuv-$target_deployment" 2>/dev/null || true
        exit 1
    fi
    
    # Wait a moment for traffic to settle
    sleep 5
    
    # Verify the switch was successful
    if curl -f -s http://localhost/api/health > /dev/null 2>&1; then
        echo "✅ Traffic switch successful - application is responding"
    else
        echo "❌ Traffic switch failed - application not responding"
        exit 1
    fi
    
    # Stop the old deployment
    if [ "$current_active" != "none" ]; then
        stop_inactive_deployment "$current_active"
    fi
    
    # Save PM2 state
    pm2 save
    
    echo "✅ Blue-Green deployment completed successfully!"
    echo "📊 Active deployment: $target_deployment"
    echo "📊 Deployment time: $(date)"
}

# Run main function
main "$@"
