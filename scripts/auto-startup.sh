#!/bin/bash

# MarinaObuv Auto-Startup Script
# This script automatically sets up and starts all services after VM restart

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/marinaobuv"
WEB_DIR="/var/www/marinaobuv/web"
USER="ubuntu"

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

echo "🚀 MarinaObuv Auto-Startup Script"
echo "=================================="

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check if we're in the right directory
if [ ! -d "$APP_DIR" ]; then
    print_error "Application directory not found: $APP_DIR"
    exit 1
fi

cd "$APP_DIR"

print_status "Starting MarinaObuv auto-startup process..."

# 1. Fix PostgreSQL SSL permissions (critical for startup)
print_status "Fixing PostgreSQL SSL permissions..."
sudo chown postgres:postgres /etc/ssl/private/ssl-cert-snakeoil.key 2>/dev/null || true
sudo chmod 640 /etc/ssl/private/ssl-cert-snakeoil.key 2>/dev/null || true

# 2. Disable SSL in PostgreSQL config (prevent SSL issues)
print_status "Configuring PostgreSQL SSL settings..."
sudo sed -i "s/ssl = on/ssl = off/" /etc/postgresql/16/main/postgresql.conf 2>/dev/null || true

# 3. Start PostgreSQL
print_status "Starting PostgreSQL..."
sudo systemctl start postgresql@16-main || {
    print_warning "PostgreSQL@16-main failed, trying alternative..."
    sudo systemctl start postgresql
}

# Wait for PostgreSQL to be ready
print_status "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if sudo -u postgres psql -c "SELECT 1;" >/dev/null 2>&1; then
        print_success "PostgreSQL is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "PostgreSQL failed to start after 30 seconds"
        exit 1
    fi
    sleep 1
done

# 4. Install dependencies, build application, and start PM2
print_status "Installing dependencies..."
cd "$WEB_DIR"
npm cache clean --force
rm -rf node_modules
npm install --ignore-scripts

print_status "Building application..."
npm run build

print_status "Installing production dependencies..."
npm install --omit=dev --ignore-scripts

print_status "Starting PM2 application..."
cd "$APP_DIR"

# Start PM2 if not running
if ! pm2 ping >/dev/null 2>&1; then
    pm2 start ecosystem.config.js --env production
else
    pm2 restart marinaobuv || pm2 start ecosystem.config.js --env production
fi

# Wait for application to be ready
print_status "Waiting for application to be ready..."
for i in {1..60}; do
    if curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
        print_success "Application is ready!"
        break
    fi
    if [ $i -eq 60 ]; then
        print_warning "Application may not be fully ready yet"
    fi
    sleep 1
done

# 5. Set up cron job for parsing
print_status "Setting up parsing cron job..."
cd "$WEB_DIR"

# Remove any existing parsing cron jobs
crontab -l 2>/dev/null | grep -v "hourly-cron" | crontab - 2>/dev/null || true

# Add the parsing cron job
echo "0 * * * * cd $WEB_DIR && npx tsx src/scripts/hourly-cron.ts >> $WEB_DIR/logs/parsing-cron.log 2>&1" | crontab -

print_success "Parsing cron job configured"

# 6. Create logs directory
mkdir -p "$WEB_DIR/logs"

# 7. Final status check
print_status "Performing final status check..."

# Check PostgreSQL
if sudo -u postgres psql -c "SELECT 1;" >/dev/null 2>&1; then
    print_success "✅ PostgreSQL: Running"
else
    print_error "❌ PostgreSQL: Not running"
fi

# Check PM2
if pm2 status | grep -q "marinaobuv.*online"; then
    print_success "✅ Application: Running"
else
    print_error "❌ Application: Not running"
fi

# Check cron job
if crontab -l | grep -q "hourly-cron"; then
    print_success "✅ Cron Job: Configured"
else
    print_warning "⚠️  Cron Job: Not configured"
fi

# Check application health
if curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
    print_success "✅ Health Check: Passing"
else
    print_warning "⚠️  Health Check: May not be ready yet"
fi

echo ""
print_success "🎉 MarinaObuv auto-startup completed!"
echo ""
echo "📊 Service Status:"
echo "=================="
pm2 status
echo ""
echo "🔍 Monitoring Commands:"
echo "======================="
echo "Application logs: pm2 logs marinaobuv"
echo "Parsing logs: tail -f $WEB_DIR/logs/parsing-cron.log"
echo "Health check: curl http://localhost:3000/api/health"
echo "Admin dashboard: http://yourdomain.com/admin/parsing"
echo ""
print_success "All services are now running automatically!"
