#!/bin/bash

# Local Environment Setup Script
# This script sets up the local environment for deployment testing

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
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

print_status "🔧 Setting up local environment for deployment testing..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "web" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# 1. Check Node.js version
print_status "🔍 Checking Node.js version..."
NODE_VERSION=$(node --version)
print_status "Node.js version: $NODE_VERSION"

if ! node -e "process.exit(parseInt(process.version.slice(1)) >= 20 ? 0 : 1)" 2>/dev/null; then
    print_error "Node.js version 20 or higher is required"
    exit 1
fi

# 2. Check if PM2 is installed
print_status "🔍 Checking PM2 installation..."
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 not found, installing globally..."
    npm install -g pm2
    print_success "PM2 installed successfully"
else
    print_success "PM2 is already installed"
fi

# 3. Check PostgreSQL
print_status "🔍 Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL is not installed. Please install PostgreSQL first."
    print_status "On macOS: brew install postgresql"
    print_status "On Linux: sudo apt-get install postgresql postgresql-contrib"
    exit 1
fi

if ! pg_isready -q; then
    print_warning "PostgreSQL is not running. Starting PostgreSQL..."
    
    # Try to start PostgreSQL automatically
    if command -v brew &> /dev/null; then
        print_status "Starting PostgreSQL with Homebrew..."
        brew services start postgresql
        sleep 3
    elif command -v systemctl &> /dev/null; then
        print_status "Starting PostgreSQL with systemctl..."
        sudo systemctl start postgresql
        sleep 3
    else
        print_error "Cannot start PostgreSQL automatically. Please start it manually."
        print_status "On macOS: brew services start postgresql"
        print_status "On Linux: sudo systemctl start postgresql"
        exit 1
    fi
    
    # Check if PostgreSQL started successfully
    if ! pg_isready -q; then
        print_error "Failed to start PostgreSQL automatically. Please start it manually."
        exit 1
    fi
fi

print_success "PostgreSQL is running"

# 4. Check if .env.local exists
print_status "🔍 Checking environment configuration..."
if [ ! -f "web/.env.local" ]; then
    print_warning ".env.local not found"
    if [ -f "web/.env.example" ]; then
        print_status "Creating .env.local from .env.example..."
        cp web/.env.example web/.env.local
        print_success ".env.local created from .env.example"
        print_warning "Please update web/.env.local with your local database configuration"
    else
        print_error ".env.example not found. Please create web/.env.local manually"
        exit 1
    fi
else
    print_success ".env.local exists"
fi

# 5. Check database connection
print_status "🔍 Testing database connection..."
cd web
if ./prisma-server.sh npx prisma db pull --print > /dev/null 2>&1; then
    print_success "Database connection successful"
else
    print_warning "Database connection test failed"
    print_status "Please check your DATABASE_URL in web/.env.local"
    print_status "Example: DATABASE_URL=\"postgresql://username:password@localhost:5432/marinaobuv\""
fi
cd ..

# 6. Install dependencies
print_status "📦 Installing dependencies..."
npm install
cd web && npm install
cd ..

# 7. Generate Prisma client
print_status "🔧 Generating Prisma client..."
cd web
./prisma-server.sh npm run prisma:generate
cd ..

print_success "✅ Local environment setup completed!"
print_status "💡 You can now run: npm run deploy:local"
print_status "💡 Make sure your database is properly configured in web/.env.local"
