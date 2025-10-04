#!/bin/bash

# Deploy MarinaObuv with Auto-Startup
# This script deploys the application and sets up automatic startup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo "🚀 MarinaObuv Deployment with Auto-Startup"
echo "=========================================="

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

print_status "Starting deployment process..."

# 1. Deploy the application (run the main deployment script)
print_status "Running main deployment..."
if [ -f "$PROJECT_DIR/deploy-pm2.sh" ]; then
    cd "$PROJECT_DIR"
    ./deploy-pm2.sh
else
    print_warning "Main deployment script not found, continuing with auto-startup setup..."
fi

# 2. Set up auto-startup
print_status "Setting up auto-startup service..."
sudo "$SCRIPT_DIR/setup-auto-startup.sh"

print_success "Auto-startup service configured"

# 3. Test the auto-startup script manually
print_status "Testing auto-startup script..."
"$SCRIPT_DIR/auto-startup.sh"

print_success "Auto-startup test completed"

echo ""
print_success "🎉 Deployment with Auto-Startup completed!"
echo ""
echo "📋 What was deployed:"
echo "====================="
echo "✅ MarinaObuv application"
echo "✅ PostgreSQL database"
echo "✅ PM2 process manager"
echo "✅ Parsing cron job"
echo "✅ Auto-startup systemd service"
echo ""
echo "🔄 Auto-Startup Features:"
echo "========================"
echo "✅ Automatically starts on VM restart"
echo "✅ Fixes PostgreSQL SSL issues"
echo "✅ Starts all services in correct order"
echo "✅ Configures parsing cron job"
echo "✅ Health checks and status monitoring"
echo ""
echo "🔍 Monitoring Commands:"
echo "======================="
echo "Service status: sudo systemctl status marinaobuv-startup"
echo "Service logs: sudo journalctl -u marinaobuv-startup -f"
echo "Application logs: pm2 logs marinaobuv"
echo "Health check: curl http://localhost:3000/api/health"
echo ""
echo "🚀 Your application will now automatically start on every VM restart!"
