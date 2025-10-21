#!/bin/bash

# Sync Migration Files Script
# This script ensures all migration files are properly synced between local and production

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
LOCAL_MIGRATIONS_PATH="./web/prisma/migrations"
PRODUCTION_MIGRATIONS_PATH="$PRODUCTION_PATH/prisma/migrations"

print_status "🔄 Syncing migration files to production server..."

# Check if we're in the right directory
if [ ! -d "$LOCAL_MIGRATIONS_PATH" ]; then
    print_error "Local migrations directory not found: $LOCAL_MIGRATIONS_PATH"
    exit 1
fi

# Get list of all migration directories
print_status "Scanning local migration files..."
LOCAL_MIGRATIONS=$(find "$LOCAL_MIGRATIONS_PATH" -maxdepth 1 -type d -name "20*" | sort)

if [ -z "$LOCAL_MIGRATIONS" ]; then
    print_error "No migration directories found in $LOCAL_MIGRATIONS_PATH"
    exit 1
fi

print_status "Found $(echo "$LOCAL_MIGRATIONS" | wc -l) migration directories locally"

# Check production server connectivity
print_status "Checking production server connectivity..."
if ! ssh -o ConnectTimeout=10 "$PRODUCTION_SERVER" "echo 'Connection successful'" > /dev/null 2>&1; then
    print_error "Cannot connect to production server: $PRODUCTION_SERVER"
    exit 1
fi

# Sync each migration directory
for migration_dir in $LOCAL_MIGRATIONS; do
    migration_name=$(basename "$migration_dir")
    print_status "Processing migration: $migration_name"
    
    # Check if migration directory exists on production
    if ssh "$PRODUCTION_SERVER" "[ -d '$PRODUCTION_MIGRATIONS_PATH/$migration_name' ]"; then
        print_status "Migration directory exists on production: $migration_name"
        
        # Check if migration.sql exists
        if ssh "$PRODUCTION_SERVER" "[ -f '$PRODUCTION_MIGRATIONS_PATH/$migration_name/migration.sql' ]"; then
            print_status "Migration file exists: $migration_name/migration.sql"
        else
            print_warning "Migration file missing: $migration_name/migration.sql"
            
            # Copy migration.sql file
            if [ -f "$migration_dir/migration.sql" ]; then
                print_status "Copying migration.sql for $migration_name..."
                scp "$migration_dir/migration.sql" "$PRODUCTION_SERVER:$PRODUCTION_MIGRATIONS_PATH/$migration_name/"
                print_success "Copied migration.sql for $migration_name"
            else
                print_error "Local migration.sql not found for $migration_name"
            fi
        fi
        
        # Check if migration.toml exists
        if ssh "$PRODUCTION_SERVER" "[ -f '$PRODUCTION_MIGRATIONS_PATH/$migration_name/migration.toml' ]"; then
            print_status "Migration.toml exists: $migration_name/migration.toml"
        else
            print_warning "Migration.toml missing: $migration_name/migration.toml"
            
            # Copy migration.toml file
            if [ -f "$migration_dir/migration.toml" ]; then
                print_status "Copying migration.toml for $migration_name..."
                scp "$migration_dir/migration.toml" "$PRODUCTION_SERVER:$PRODUCTION_MIGRATIONS_PATH/$migration_name/"
                print_success "Copied migration.toml for $migration_name"
            else
                print_error "Local migration.toml not found for $migration_name"
            fi
        fi
    else
        print_warning "Migration directory missing on production: $migration_name"
        
        # Create the directory and copy all files
        print_status "Creating migration directory and copying files for $migration_name..."
        ssh "$PRODUCTION_SERVER" "mkdir -p '$PRODUCTION_MIGRATIONS_PATH/$migration_name'"
        
        # Copy all files in the migration directory
        scp -r "$migration_dir"/* "$PRODUCTION_SERVER:$PRODUCTION_MIGRATIONS_PATH/$migration_name/"
        print_success "Created and populated migration directory for $migration_name"
    fi
done

# Verify migration status on production
print_status "Verifying migration status on production server..."
ssh "$PRODUCTION_SERVER" "cd $PRODUCTION_PATH && npx prisma migrate status"

print_success "✅ Migration files sync completed!"
print_status "All migration files have been synchronized with the production server."
