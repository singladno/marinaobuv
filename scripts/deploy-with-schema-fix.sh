#!/bin/bash

# Enhanced Deployment Script with Schema Fix for MarinaObuv
# This script deploys the application with automatic database schema fixing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Configuration
APP_NAME="marinaobuv"
WEB_DIR="web"

log_info "🚀 Starting enhanced deployment with schema fix..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "$WEB_DIR" ]; then
    log_error "Please run this script from the project root directory"
    exit 1
fi

# Step 1: Install dependencies
log_info "Step 1: Installing dependencies..."
npm install
cd $WEB_DIR
npm install
cd ..

# Step 2: Fix database schema
log_info "Step 2: Ensuring database schema is correct..."
cd $WEB_DIR
if [ -f "scripts/fix-database-schema.sh" ]; then
    if bash scripts/fix-database-schema.sh; then
        log_success "Database schema verified and fixed"
    else
        log_error "Database schema fix failed"
        exit 1
    fi
else
    log_warning "Schema fix script not found, using manual approach..."
    
    # Try standard migrations first
    if ./prisma-server.sh npx prisma migrate deploy; then
        log_success "Standard migrations applied successfully"
    else
        log_warning "Standard migrations failed, trying schema push..."
        if ./prisma-server.sh npx prisma db push --accept-data-loss; then
            log_success "Database schema synchronized"
        else
            log_error "All migration attempts failed"
            exit 1
        fi
    fi
    
    # Regenerate Prisma client
    if ./prisma-server.sh npm run prisma:generate; then
        log_success "Prisma client regenerated"
    else
        log_error "Prisma client regeneration failed"
        exit 1
    fi
fi
cd ..

# Step 3: Build application
log_info "Step 3: Building application..."
cd $WEB_DIR
if npm run build; then
    log_success "Application built successfully"
else
    log_error "Application build failed"
    exit 1
fi
cd ..

# Step 4: Restart PM2
log_info "Step 4: Restarting PM2 application..."
if pm2 restart $APP_NAME; then
    log_success "PM2 application restarted successfully"
else
    log_warning "PM2 restart failed, trying to start..."
    if pm2 start ecosystem.config.js --env production; then
        log_success "PM2 application started successfully"
    else
        log_error "PM2 start failed"
        exit 1
    fi
fi

# Step 5: Verify deployment
log_info "Step 5: Verifying deployment..."
sleep 5

if pm2 list | grep -q "$APP_NAME.*online"; then
    log_success "Application is running successfully"
else
    log_error "Application is not running"
    log_info "PM2 status:"
    pm2 status
    log_info "Recent logs:"
    pm2 logs $APP_NAME --lines 20
    exit 1
fi

# Step 6: Health check
log_info "Step 6: Performing health check..."
if curl -s http://localhost:3000/api/health > /dev/null; then
    log_success "Health check passed"
else
    log_warning "Health check failed, but application is running"
fi

log_success "🎉 Enhanced deployment completed successfully!"
log_info ""
log_info "Useful commands:"
log_info "  Check status: pm2 status"
log_info "  View logs: pm2 logs $APP_NAME"
log_info "  Monitor: pm2 monit"
log_info "  Restart: pm2 restart $APP_NAME"
log_info ""
log_info "Your application should now be accessible at:"
log_info "  http://localhost:3000"
