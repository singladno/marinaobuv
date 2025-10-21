#!/bin/bash

# Quick Deployment Fix for MarinaObuv
# This script fixes the current deployment issue by ensuring the database schema is correct

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

log_info "🔧 Quick deployment fix for MarinaObuv..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "web" ]; then
    log_error "Please run this script from the project root directory"
    exit 1
fi

# Navigate to web directory
cd web

log_info "Step 1: Fixing database schema..."
if [ -f "scripts/fix-database-schema.sh" ]; then
    if bash scripts/fix-database-schema.sh; then
        log_success "Database schema fixed successfully"
    else
        log_error "Database schema fix failed"
        exit 1
    fi
else
    log_warning "Schema fix script not found, trying manual fix..."
    
    # Manual schema fix
    if ./prisma-server.sh npx prisma migrate deploy; then
        log_success "Migrations applied successfully"
    else
        log_warning "Standard migrations failed, trying db push..."
        if ./prisma-server.sh npx prisma db push --accept-data-loss; then
            log_success "Database schema synchronized"
        else
            log_error "Manual schema fix failed"
            exit 1
        fi
    fi
fi

log_info "Step 2: Regenerating Prisma client..."
if ./prisma-server.sh npm run prisma:generate; then
    log_success "Prisma client regenerated"
else
    log_error "Prisma client regeneration failed"
    exit 1
fi

log_info "Step 3: Building application..."
if npm run build; then
    log_success "Application built successfully"
else
    log_error "Application build failed"
    exit 1
fi

log_info "Step 4: Restarting PM2 application..."
cd ..
if pm2 restart marinaobuv; then
    log_success "PM2 application restarted successfully"
else
    log_error "PM2 restart failed"
    exit 1
fi

log_success "🎉 Quick deployment fix completed!"
log_info "Your application should now be running properly."
log_info "Check status with: pm2 status"
log_info "Check logs with: pm2 logs marinaobuv"
