#!/bin/bash

# Fix Database Schema Script for MarinaObuv
# This script ensures the database schema is properly synchronized with migrations

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

# Function to check if we're in the web directory
check_web_directory() {
    if [ ! -f "package.json" ] || [ ! -d "prisma" ]; then
        log_error "Please run this script from the web directory"
        exit 1
    fi
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

# Function to check if required fields exist
check_required_fields() {
    log_info "Checking for required database fields..."
    
    local db_schema=$(./prisma-server.sh npx prisma db pull --print 2>/dev/null)
    
    local missing_fields=()
    
    # Check for batch processing fields
    if ! echo "$db_schema" | grep -q "analysisBatchId"; then
        missing_fields+=("analysisBatchId")
    fi
    
    if ! echo "$db_schema" | grep -q "colorBatchId"; then
        missing_fields+=("colorBatchId")
    fi
    
    if ! echo "$db_schema" | grep -q "batchProcessingStatus"; then
        missing_fields+=("batchProcessingStatus")
    fi
    
    # Check for other critical fields
    if ! echo "$db_schema" | grep -q "activeUpdatedAt"; then
        missing_fields+=("activeUpdatedAt")
    fi
    
    if [ ${#missing_fields[@]} -eq 0 ]; then
        log_success "All required fields are present"
        return 0
    else
        log_warning "Missing fields: ${missing_fields[*]}"
        return 1
    fi
}

# Function to force schema synchronization
force_schema_sync() {
    log_info "Forcing database schema synchronization..."
    
    # First, try to reset and apply migrations
    log_info "Attempting to reset and apply migrations..."
    if ./prisma-server.sh npx prisma migrate reset --force; then
        log_success "Database reset and migrations applied successfully"
        return 0
    else
        log_warning "Migration reset failed, trying db push..."
        
        # If reset fails, try db push
        if ./prisma-server.sh npx prisma db push --accept-data-loss; then
            log_success "Database schema pushed successfully"
            return 0
        else
            log_error "Both migration reset and db push failed"
            return 1
        fi
    fi
}

# Function to run migrations with retry logic
run_migrations_with_retry() {
    log_info "Running migrations with retry logic..."
    
    local max_attempts=3
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Migration attempt $attempt of $max_attempts..."
        
        if ./prisma-server.sh npx prisma migrate deploy; then
            log_success "Migrations applied successfully on attempt $attempt"
            return 0
        else
            log_warning "Migration attempt $attempt failed"
            attempt=$((attempt + 1))
            
            if [ $attempt -le $max_attempts ]; then
                log_info "Waiting 5 seconds before retry..."
                sleep 5
            fi
        fi
    done
    
    log_error "All migration attempts failed"
    return 1
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

# Function to run data migrations
run_data_migrations() {
    log_info "Running data migrations..."
    if ./prisma-server.sh npx tsx src/scripts/run-migrations.ts; then
        log_success "Data migrations completed successfully"
        return 0
    else
        log_warning "Data migrations failed, but continuing..."
        return 1
    fi
}

# Main function
main() {
    log_info "🔧 Starting database schema fix..."
    
    # Check if we're in the right directory
    check_web_directory
    
    # Step 1: Validate database connection
    if ! validate_db_connection; then
        log_error "Cannot proceed without database connection"
        exit 1
    fi
    
    # Step 2: Check if required fields exist
    if check_required_fields; then
        log_success "Database schema is already correct!"
        exit 0
    fi
    
    # Step 3: Try to run migrations first
    log_info "Attempting to apply pending migrations..."
    if run_migrations_with_retry; then
        log_success "Migrations applied successfully"
    else
        log_warning "Standard migrations failed, forcing schema sync..."
        if ! force_schema_sync; then
            log_error "Failed to fix database schema"
            exit 1
        fi
    fi
    
    # Step 4: Verify schema is now correct
    if check_required_fields; then
        log_success "Database schema is now correct!"
    else
        log_error "Database schema is still missing required fields"
        exit 1
    fi
    
    # Step 5: Regenerate Prisma client
    if ! regenerate_client; then
        log_error "Failed to regenerate Prisma client"
        exit 1
    fi
    
    # Step 6: Run data migrations
    run_data_migrations
    
    log_success "🎉 Database schema fix completed successfully!"
}

# Run main function
main "$@"
