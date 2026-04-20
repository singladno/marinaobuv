#!/bin/bash

# Blue-Green Zero-Downtime Deployment Script
# This script implements blue-green deployment to eliminate 502 errors

set -e

echo "🚀 Starting Blue-Green Zero-Downtime Deployment..."

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Load environment variables safely
# NOTE: Don't use 'set -a' globally - it causes "Argument list too long" error
# when appleboy/ssh-action tries to print environment variables
load_env() {
    local env_file="$1"
    if [ -f "$env_file" ]; then
        echo "🔧 Loading environment variables from $env_file..."
        # Process the .env file line by line, handling quotes properly
        # Only export variables needed for PM2/Next.js (they read .env directly)
        # Don't use 'set -a' to avoid exporting everything globally
        while IFS= read -r line || [ -n "$line" ]; do
            # Skip empty lines and comments
            if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
                continue
            fi

            # Extract key and value, handling quotes properly
            if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
                local key="${BASH_REMATCH[1]}"
                local value="${BASH_REMATCH[2]}"

                # Remove surrounding quotes if they exist and match
                if [[ "$value" =~ ^\"(.*)\"$ ]] || [[ "$value" =~ ^\'(.*)\'$ ]]; then
                    value="${BASH_REMATCH[1]}"
                fi

                # Only export critical variables needed for the script itself
                # PM2 and Next.js will read .env file directly, so we don't need to export everything
                case "$key" in
                    DATABASE_URL|NODE_ENV|PORT|HOSTNAME)
                        export "$key=$value"
                        ;;
                    *)
                        # Don't export other variables - they'll be read from .env by Next.js/PM2
                        ;;
                esac
            fi
        done < "$env_file"
    else
        echo "❌ Environment file not found: $env_file"
        exit 1
    fi
}

load_env "web/.env"

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

  # Update nginx HTTP configuration to point to the new deployment
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
        proxy_pass http://127.0.0.1:$target_port;
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

    # API routes — admin first (higher limit); requires zone=admin_api in nginx.conf
    location /api/admin/ {
        limit_req zone=admin_api burst=300 nodelay;
        proxy_pass http://127.0.0.1:$target_port;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 120s;
    }

    location /api/ {
        limit_req zone=api burst=80 nodelay;
        proxy_pass http://127.0.0.1:$target_port;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 120s;
    }

    # Static files with caching
    location /_next/static/ {
        proxy_pass http://127.0.0.1:$target_port;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
        expires 1y;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:$target_port/api/health;
        access_log off;
    }
}
EOF

  # Use Let's Encrypt only; never overwrite HTTPS config with self-signed (breaks browser trust after deploy)
  local CERT_PATH="/etc/letsencrypt/live/marina-obuv.ru/fullchain.pem"
  local KEY_PATH="/etc/letsencrypt/live/marina-obuv.ru/privkey.pem"
  local USE_LE=0
  if [ -f "$CERT_PATH" ] && [ -f "$KEY_PATH" ]; then
    USE_LE=1
  fi

  # Update nginx HTTPS configuration to point to the new deployment (with proper certs)
  if [ "$USE_LE" = "1" ]; then
  sudo tee /etc/nginx/sites-available/marinaobuv-https > /dev/null << EOF
server {
    listen 443 ssl http2;
    server_name marina-obuv.ru www.marina-obuv.ru;

    ssl_certificate ${CERT_PATH};
    ssl_certificate_key ${KEY_PATH};

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Main application - proxy to active deployment
    location / {
        proxy_pass http://127.0.0.1:${target_port};
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

    # API routes — admin first (higher limit)
    location /api/admin/ {
        limit_req zone=admin_api burst=300 nodelay;
        proxy_pass http://127.0.0.1:${target_port};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /api/ {
        limit_req zone=api burst=80 nodelay;
        proxy_pass http://127.0.0.1:${target_port};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:${target_port}/api/health;
        access_log off;
    }
}
EOF
  fi
  # When USE_LE=0 we leave sites-available as-is (certbot or existing config keeps valid cert)

  # HTTPS is served from conf.d/marinaobuv-https.conf only. Do NOT symlink sites-available →
  # sites-enabled or nginx logs "conflicting server name" and ignores one vhost.

  # conf.d/marinaobuv-https.conf: either write full config with LE cert, or only update proxy port (keep existing cert)
  if [ "$USE_LE" = "1" ]; then
  # Also write HTTPS to conf.d so it wins when nginx only includes conf.d/*.conf (same port as HTTP)
  sudo tee /etc/nginx/conf.d/marinaobuv-https.conf > /dev/null << CONFDEOF
# HTTPS server - port set by blue-green switch_nginx_traffic
server {
    listen 443 ssl http2;
    server_name marina-obuv.ru www.marina-obuv.ru;

    client_max_body_size 20M;

    ssl_certificate ${CERT_PATH};
    ssl_certificate_key ${KEY_PATH};
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://127.0.0.1:${target_port};
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

    location /api/admin/ {
        limit_req zone=admin_api burst=300 nodelay;
        proxy_pass http://127.0.0.1:${target_port};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 120s;
    }

    location /api/ {
        limit_req zone=api burst=80 nodelay;
        proxy_pass http://127.0.0.1:${target_port};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 120s;
    }

    location /login {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://127.0.0.1:${target_port};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /_next/static/ {
        proxy_pass http://127.0.0.1:${target_port};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
        expires 1y;
        proxy_buffering off;
    }

    location /_next/image {
        proxy_pass http://127.0.0.1:${target_port};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:${target_port}/api/health;
        access_log off;
    }
}
CONFDEOF
  else
    # Let's Encrypt not found: do not overwrite cert. Only update proxy port in existing conf.d HTTPS config.
    if [ -f /etc/nginx/conf.d/marinaobuv-https.conf ]; then
      sudo sed -i "s|proxy_pass http://127.0.0.1:[0-9]*|proxy_pass http://127.0.0.1:${target_port}|g" /etc/nginx/conf.d/marinaobuv-https.conf
      sudo sed -i "s|proxy_pass http://localhost:[0-9]*|proxy_pass http://127.0.0.1:${target_port}|g" /etc/nginx/conf.d/marinaobuv-https.conf
      echo "✅ Updated only proxy port to ${target_port} in conf.d HTTPS config (cert unchanged)"
    fi
  fi

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

    # Determine ports (blue=3000, green=3001)
    local target_port
    if [ "$target_deployment" = "blue" ]; then
        target_port=3000
    else
        target_port=3001
    fi

    echo "🔍 Port configuration:"
    echo "   Target deployment ($target_deployment): port $target_port"

    # Always rebuild application to ensure static files match HTML
    # This prevents issues where HTML references CSS/JS files that don't exist
    # CRITICAL: Build while old instance is still running to avoid downtime
    echo "🔨 Building application (always rebuild to ensure consistency)..."
    echo "ℹ️  Building new version while current instance continues serving traffic..."

    # Determine which instance is currently active (if any)
    local current_active=$(get_active_deployment)
    if [ "$current_active" != "none" ]; then
        echo "✅ Current $current_active deployment is still running and serving traffic"
        echo "   Building new version in parallel - no downtime expected"
    else
        echo "⚠️  No active deployment found - this will cause brief downtime"
    fi

    # Build into `.next-staging` only — NEVER `rm -rf .next` before a successful build.
    # The live slot keeps serving from `.next` until we promote after health checks.
    STAGING_DIR=".next-staging"
    echo "🧹 Cleaning stale staging output only (${STAGING_DIR})..."
    rm -rf "web/${STAGING_DIR}"

    # Build the application while old instance is still running (it keeps using `.next`).
    # Use pipefail so a failed `next build` is not masked by `tee` (pipeline would otherwise exit 0).
    echo "🔨 Running production build into ${STAGING_DIR} (live traffic unchanged)..."
    (
      set -o pipefail
      cd web
      export NEXT_DIST_DIR="${STAGING_DIR}"
      timeout 1800 npm run build 2>&1 | tee /tmp/build.log
    ) || {
        echo "❌ Build failed or timed out — leaving existing .next untouched"
        tail -50 /tmp/build.log || true
        rm -rf "web/${STAGING_DIR}" 2>/dev/null || true
        exit 1
    }

    # Verify build was successful
    if [ ! -f "web/${STAGING_DIR}/BUILD_ID" ]; then
        echo "❌ Build failed - BUILD_ID not found in ${STAGING_DIR}"
        rm -rf "web/${STAGING_DIR}" 2>/dev/null || true
        exit 1
    fi

    # next start requires prerender-manifest.json; npm run build runs ensure-prerender-manifest.mjs,
    # but re-run if someone invoked `next build` directly or output was incomplete
    if [ ! -f "web/${STAGING_DIR}/prerender-manifest.json" ]; then
        echo "⚠️  prerender-manifest.json missing after build — creating minimal manifest..."
        ( cd web && NEXT_DIST_DIR="${STAGING_DIR}" node scripts/ensure-prerender-manifest.mjs ) || {
            echo "❌ Could not ensure prerender-manifest.json — next start will crash"
            rm -rf "web/${STAGING_DIR}" 2>/dev/null || true
            exit 1
        }
    fi
    if [ ! -f "web/${STAGING_DIR}/prerender-manifest.json" ]; then
        echo "❌ prerender-manifest.json still missing — aborting deploy"
        rm -rf "web/${STAGING_DIR}" 2>/dev/null || true
        exit 1
    fi

    BUILD_ID=$(cat "web/${STAGING_DIR}/BUILD_ID")
    echo "✅ Build completed successfully (Build ID: $BUILD_ID)"
    if [ "$current_active" != "none" ]; then
        echo "✅ Old $current_active deployment is still running - zero downtime achieved"
    fi

    # CRITICAL: Stop target deployment first to avoid port conflicts
    # The target deployment should be inactive, but ensure it's stopped
    echo "🛑 Ensuring $target_deployment deployment is stopped (target port $target_port)..."
    pm2 stop "marinaobuv-$target_deployment" 2>/dev/null || true
    pm2 delete "marinaobuv-$target_deployment" 2>/dev/null || true
    sleep 1

    # Verify target port is free before starting
    echo "🔍 Checking target port $target_port is free..."
    if lsof -i :$target_port >/dev/null 2>&1; then
        echo "⚠️  Target port $target_port is still in use! Attempting to free it..."
        lsof -ti :$target_port | xargs kill -9 2>/dev/null || true
        sleep 2
        if lsof -i :$target_port >/dev/null 2>&1; then
            echo "❌ CRITICAL: Port $target_port is still in use after cleanup!"
            echo "   Cannot start $target_deployment deployment - port conflict!"
            exit 1
        fi
    fi

    # Start target deployment (serve from staging dir until we promote after cutover)
    echo "🚀 Starting $target_deployment deployment on port $target_port (NEXT_DIST_DIR=${STAGING_DIR})..."
    export NEXT_DIST_DIR="${STAGING_DIR}"
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

    # Promote staging build → `.next` so the next deploy can rebuild `.next-staging` safely
    # and PM2 restarts use the default distDir without env.
    echo "📦 Promoting ${STAGING_DIR} → .next (atomic)..."
    pm2 stop "marinaobuv-$target_deployment" 2>/dev/null || true
    cd web
    rm -rf .next-trash-deploy
    if [ ! -d "${STAGING_DIR}" ]; then
        echo "❌ ${STAGING_DIR} missing — cannot promote"
        cd ..
        exit 1
    fi
    if [ -d .next ]; then
        mv .next .next-trash-deploy
    fi
    mv "${STAGING_DIR}" .next
    rm -rf .next-trash-deploy
    cd ..
    unset NEXT_DIST_DIR
    export NEXT_DIST_DIR=
    pm2 delete "marinaobuv-$target_deployment" 2>/dev/null || true
    pm2 start ecosystem-blue-green.config.js --only "marinaobuv-$target_deployment" --env production --update-env

    if ! check_deployment_health "$target_deployment" "$target_port"; then
        echo "❌ Active deployment unhealthy after promote — manual recovery may be needed"
        exit 1
    fi

    # Parser is cron-only — remove legacy PM2 name if present so it is never resurrected
    pm2 delete groq-sequential 2>/dev/null || true

    # Save PM2 state
    pm2 save

    echo "✅ Blue-Green deployment completed successfully!"
    echo "📊 Active deployment: $target_deployment"
    echo "📊 Deployment time: $(date)"
}

# Run main function
main "$@"
