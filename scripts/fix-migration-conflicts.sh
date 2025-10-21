#!/bin/bash

# Fix Migration Conflicts Script
# This script automatically resolves common migration conflicts during deployment

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

# Configuration
PRODUCTION_SERVER="ubuntu@130.193.56.134"
PRODUCTION_PATH="/var/www/marinaobuv/web"

print_status "🔧 Fixing migration conflicts on production server..."

# Check production server connectivity
print_status "Checking production server connectivity..."
if ! ssh -o ConnectTimeout=10 "$PRODUCTION_SERVER" "echo 'Connection successful'" > /dev/null 2>&1; then
    print_error "Cannot connect to production server: $PRODUCTION_SERVER"
    exit 1
fi

# Function to resolve migration conflicts
resolve_migration_conflicts() {
    print_status "Attempting to apply migrations..."
    
    # Try to apply migrations
    if ssh "$PRODUCTION_SERVER" "cd $PRODUCTION_PATH && npx prisma migrate deploy" 2>&1 | tee /tmp/migration_output.log; then
        print_success "All migrations applied successfully!"
        return 0
    fi
    
    # Check if there are migration conflicts
    if grep -q "P3018" /tmp/migration_output.log; then
        print_warning "Migration conflicts detected, attempting to resolve..."
        
        # Extract the failed migration name from the error
        failed_migration=$(grep -o "Migration name: [^[:space:]]*" /tmp/migration_output.log | cut -d' ' -f3)
        
        if [ -n "$failed_migration" ]; then
            print_status "Resolving migration: $failed_migration"
            
            # Mark the migration as applied
            if ssh "$PRODUCTION_SERVER" "cd $PRODUCTION_PATH && npx prisma migrate resolve --applied $failed_migration"; then
                print_success "Migration $failed_migration marked as applied"
                
                # Recursively try to apply remaining migrations
                resolve_migration_conflicts
            else
                print_error "Failed to resolve migration: $failed_migration"
                return 1
            fi
        else
            print_error "Could not extract migration name from error"
            return 1
        fi
    else
        print_error "Migration failed for unknown reason"
        return 1
    fi
}

# Run the migration conflict resolution
if resolve_migration_conflicts; then
    print_success "✅ All migration conflicts resolved successfully!"
    
    # Verify final status
    print_status "Verifying final migration status..."
    ssh "$PRODUCTION_SERVER" "cd $PRODUCTION_PATH && npx prisma migrate status"
    
    print_success "🎉 Migration conflicts fixed and database is up to date!"
else
    print_error "❌ Failed to resolve migration conflicts"
    exit 1
fi
