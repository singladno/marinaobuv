#!/bin/bash

# Robust Migration System for MarinaObuv
# This script ensures migrations are applied correctly with proper validation

set -e  # Exit on any error

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

# Function to validate database connection
validate_db_connection() {
    log_info "Validating database connection..."
    if ./prisma-server.sh npx prisma db pull --print > /dev/null 2>&1; then
        log_success "Database connection validated"
        return 0
    else
        log_error "Database connection failed"
        return 1
    fi
}

# Function to check migration status with detailed output
check_migration_status() {
    log_info "Checking migration status..."
    ./prisma-server.sh npx prisma migrate status
    return $?
}

# Function to validate schema matches migrations
validate_schema() {
    log_info "Validating schema matches migrations..."
    
    # Get current schema from database
    local db_schema=$(./prisma-server.sh npx prisma db pull --print 2>/dev/null)
    
    # Check for specific fields that should exist
    if echo "$db_schema" | grep -q "analysisBatchId"; then
        log_success "Schema validation passed - batch processing fields exist"
        return 0
    else
        log_warning "Schema validation failed - missing expected fields"
        return 1
    fi
}

# Function to run migrations with validation
run_migrations() {
    log_info "Running database migrations..."
    
    # Step 1: Check current status
    if ! check_migration_status; then
        log_error "Migration status check failed"
        return 1
    fi
    
    # Step 2: Run migrations
    log_info "Applying migrations..."
    if ./prisma-server.sh npm run prisma:migrate:deploy; then
        log_success "Migrations applied successfully"
    else
        log_error "Migration deployment failed"
        return 1
    fi
    
    # Step 3: Validate schema
    if validate_schema; then
        log_success "Schema validation passed"
    else
        log_warning "Schema validation failed - attempting to fix schema..."
        if ../scripts/fix-database-schema.sh; then
            log_success "Schema fix completed successfully"
        else
            log_error "Schema fix failed - manual intervention required"
            return 1
        fi
    fi
    
    return 0
}

# Function to regenerate Prisma client
regenerate_client() {
    log_info "Regenerating Prisma client..."
    if ./prisma-server.sh npm run prisma:generate; then
        log_success "Prisma client regenerated successfully"
        return 0
    else
        log_error "Prisma client regeneration failed"
        return 1
    fi
}

# Function to run centralized migrations
run_centralized_migrations() {
    log_info "Running centralized migrations..."
    if ./prisma-server.sh npx tsx src/scripts/run-migrations.ts; then
        log_success "Centralized migrations completed"
        return 0
    else
        log_warning "Centralized migrations failed - continuing with deployment"
        return 1
    fi
}

# Function to create migration backup
create_migration_backup() {
    log_info "Creating migration backup..."
    if ./prisma-server.sh npm run db:backup; then
        log_success "Migration backup created"
        return 0
    else
        log_warning "Migration backup failed - continuing without backup"
        return 1
    fi
}

# Main migration function
main() {
    log_info "🚀 Starting robust migration system..."
    
    # Pre-migration checks
    if ! validate_db_connection; then
        log_error "Database connection validation failed"
        exit 1
    fi
    
    # Create backup before migrations
    create_migration_backup
    
    # Run Prisma migrations
    if ! run_migrations; then
        log_error "Prisma migrations failed"
        exit 1
    fi
    
    # Regenerate Prisma client
    if ! regenerate_client; then
        log_error "Prisma client regeneration failed"
        exit 1
    fi
    
    # Run centralized migrations
    run_centralized_migrations
    
    # Final validation
    if validate_db_connection; then
        log_success "🎉 Migration system completed successfully!"
        return 0
    else
        log_error "Final validation failed"
        exit 1
    fi
}

# Run main function
main "$@"
