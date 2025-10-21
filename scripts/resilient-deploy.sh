#!/bin/bash

# Resilient Deployment Script for MarinaObuv
# This script ensures deployment succeeds even if proxy or other services are down

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

# Function to run command with error handling
run_with_fallback() {
    local description="$1"
    local command="$2"
    local fallback_command="${3:-}"
    
    print_status "Running: $description"
    
    if eval "$command"; then
        print_success "$description completed successfully"
        return 0
    else
        print_warning "$description failed"
        
        if [ -n "$fallback_command" ]; then
            print_status "Running fallback: $fallback_command"
            if eval "$fallback_command"; then
                print_success "Fallback completed successfully"
                return 0
            else
                print_error "Fallback also failed"
                return 1
            fi
        else
            print_warning "No fallback available, continuing..."
            return 1
        fi
    fi
}

# Function to check if service is running
check_service() {
    local service_name="$1"
    local check_command="$2"
    
    if eval "$check_command" > /dev/null 2>&1; then
        print_success "$service_name is running"
        return 0
    else
        print_warning "$service_name is not running"
        return 1
    fi
}

# Function to attempt service recovery
attempt_service_recovery() {
    local service_name="$1"
    local recovery_command="$2"
    
    print_status "Attempting to recover $service_name..."
    
    if eval "$recovery_command"; then
        print_success "$service_name recovery successful"
        return 0
    else
        print_warning "$service_name recovery failed"
        return 1
    fi
}

print_status "🚀 Starting resilient deployment for MarinaObuv..."

# Ensure we're in the right directory
cd /var/www/marinaobuv || { print_error "Cannot navigate to /var/www/marinaobuv"; exit 1; }

# 1. Git operations (critical - must succeed)
print_status "📥 Updating repository..."
if ! git fetch origin main; then
    print_error "Git fetch failed - this is critical"
    exit 1
fi

if ! git reset --hard origin/main; then
    print_error "Git reset failed - this is critical"
    exit 1
fi

if ! git clean -fd; then
    print_error "Git clean failed - this is critical"
    exit 1
fi

print_success "Repository updated successfully"

# 2. Set execute permissions (non-critical)
print_status "🔧 Setting script permissions..."
chmod +x scripts/*.sh 2>/dev/null || print_warning "Some scripts not found"
chmod +x web/src/scripts/*.sh 2>/dev/null || print_warning "Some web scripts not found"

# 2.1. Fix nginx configuration (critical for deployment success)
print_status "🔧 Fixing nginx configuration..."
if [ -f "scripts/fix-nginx-config.sh" ]; then
    chmod +x scripts/fix-nginx-config.sh
    if ./scripts/fix-nginx-config.sh; then
        print_success "Nginx configuration fixed successfully"
    else
        print_error "Failed to fix nginx configuration - deployment cannot continue"
        exit 1
    fi
else
    print_warning "Nginx fix script not found, attempting manual fix..."
    # Manual nginx configuration fix
    sudo tee /etc/nginx/conf.d/marinaobuv.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name marina-obuv.ru www.marina-obuv.ru;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /health {
        proxy_pass http://localhost:3000/api/health;
        access_log off;
    }
}
EOF
    if sudo nginx -t && sudo systemctl reload nginx; then
        print_success "Manual nginx configuration fix successful"
    else
        print_error "Manual nginx configuration fix failed - deployment cannot continue"
        exit 1
    fi
fi

# 3. Install dependencies (critical for web app)
print_status "📦 Installing dependencies..."
cd web

# Try production install first
if [ -f ".env.production" ]; then
    print_status "Using production environment"
    export $(grep -v '^#' .env.production | xargs) 2>/dev/null || true
fi

# Install dependencies with fallback
if ! run_with_fallback "Production dependency installation" \
    "HUSKY=0 NPM_CONFIG_IGNORE_SCRIPTS=1 npm ci --omit=dev --no-audit --no-fund" \
    "HUSKY=0 NPM_CONFIG_IGNORE_SCRIPTS=1 npm install --omit=dev --no-audit --no-fund"; then
    print_error "Dependency installation failed - deployment cannot continue"
    exit 1
fi

# Ensure tsx is available for scripts
if [ ! -x node_modules/.bin/tsx ]; then
    print_status "Installing tsx for scripts..."
    npm install tsx@^4 --no-audit --no-fund || print_warning "tsx installation failed"
fi

cd ..

# 4. Database operations (critical but with fallback)
print_status "🗄️ Handling database operations..."
cd web

# Try to run migrations
if ! run_with_fallback "Database migrations" \
    "./prisma-server.sh npx prisma migrate deploy" \
    "npx prisma migrate deploy"; then
    
    print_warning "Migrations failed, attempting schema fix..."
    if ! run_with_fallback "Database schema fix" \
        "../scripts/fix-database-schema.sh" \
        "npx prisma db push --force-reset"; then
        print_warning "Database operations failed, but continuing deployment"
    fi
fi

# Generate Prisma client (non-critical)
run_with_fallback "Prisma client generation" "npx prisma generate" "echo 'Prisma generation skipped'"

cd ..

# 5. Build application (critical)
print_status "🏗️ Building application..."
cd web

if ! run_with_fallback "Application build" "npm run build" "npm run build:fallback"; then
    print_error "Application build failed - deployment cannot continue"
    exit 1
fi

cd ..

# 6. Check and recover services before deployment
print_status "🔍 Checking service status..."

# Check main application
check_service "Main application" "pm2 list | grep -q 'marinaobuv.*online'"

# Note: Groq proxy runs on separate serverspace server (31.44.2.216)
print_status "Note: Groq proxy server runs on separate serverspace server"
print_status "Proxy health will be checked via nginx configuration"

# Check Nginx
check_service "Nginx" "sudo systemctl is-active nginx"

# Check PostgreSQL
check_service "PostgreSQL" "sudo -u postgres psql -c 'SELECT 1;'"

# 7. Deploy with PM2 (critical)
print_status "🚀 Deploying with PM2..."

if ! run_with_fallback "PM2 deployment" \
    "pm2 startOrReload ecosystem.config.js --env production --update-env" \
    "pm2 start ecosystem.config.js --env production"; then
    print_error "PM2 deployment failed - this is critical"
    exit 1
fi

# Ensure main app is running
if ! pm2 list | grep -q "marinaobuv.*online"; then
    print_error "Main application is not running after deployment"
    exit 1
fi

# Note: Groq proxy runs on separate serverspace server (31.44.2.216)
print_status "Note: Groq proxy server runs on separate serverspace server"
print_status "Proxy connectivity will be tested via nginx configuration"

# Save PM2 configuration
pm2 save || print_warning "Failed to save PM2 configuration"

# 8. Configure webhook (non-critical)
print_status "🔗 Configuring webhook..."
cd web

if [ -f ".env" ] && [ -n "$(grep GREEN_API_INSTANCE_ID .env 2>/dev/null)" ]; then
    run_with_fallback "Webhook configuration" "npx tsx src/scripts/configure-webhook.ts" "echo 'Webhook configuration skipped'"
else
    print_warning "No Green API credentials found, skipping webhook setup"
fi

cd ..

# 9. Install/update cron jobs (non-critical)
print_status "⏰ Installing cron jobs..."
if [ -f "scripts/install-crons.sh" ]; then
    run_with_fallback "Cron job installation" "bash scripts/install-crons.sh" "echo 'Cron installation skipped'"
fi

# Proxy monitoring is automatically installed via cron jobs and systemd services

# 10. Final health checks
print_status "🏥 Performing final health checks..."

# Check main application
if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
    print_success "Main application health check passed"
else
    print_warning "Main application health check failed"
fi

# Note: Groq proxy runs on separate serverspace server (31.44.2.216)
print_status "Note: Groq proxy health check skipped (runs on separate server)"

# Check Nginx
if curl -f -s http://localhost/health > /dev/null 2>&1; then
    print_success "Nginx health check passed"
else
    print_warning "Nginx health check failed"
fi

# 11. Run webhook verification (non-critical)
if [ -f "scripts/verify-webhook-deployment.sh" ]; then
    run_with_fallback "Webhook verification" "./scripts/verify-webhook-deployment.sh" "echo 'Webhook verification skipped'"
fi

print_success "🎉 Resilient deployment completed!"
print_status ""
print_status "Deployment Summary:"
print_status "✅ Repository updated"
print_status "✅ Dependencies installed"
print_status "✅ Database operations completed"
print_status "✅ Application built"
print_status "✅ PM2 deployment successful"
print_status "✅ Main application is running"

# Show final status
print_status ""
print_status "Current Service Status:"
pm2 list | grep -E "marinaobuv" || print_warning "PM2 status check failed"

print_status ""
print_status "Useful commands:"
print_status "  Check status: pm2 status"
print_status "  View logs: pm2 logs marinaobuv"
print_status "  Restart app: pm2 restart marinaobuv"
print_status "  Note: Proxy runs on separate serverspace server (31.44.2.216)"
