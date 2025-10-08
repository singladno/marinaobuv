#!/bin/bash

# Force Schema Synchronization Script
# This script forces the database schema to match the Prisma schema

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Function to check if column exists
check_column_exists() {
    local table="$1"
    local column="$2"
    
    if ./prisma-server.sh npx prisma db execute --stdin <<< "SELECT $column FROM \"$table\" LIMIT 1;" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to add missing columns
add_missing_columns() {
    log_info "Adding missing batch processing columns..."
    
    # Check and add analysisBatchId
    if ! check_column_exists "Product" "analysisBatchId"; then
        log_info "Adding analysisBatchId column..."
        ./prisma-server.sh npx prisma db execute --stdin <<< "ALTER TABLE \"Product\" ADD COLUMN \"analysisBatchId\" TEXT;"
        log_success "Added analysisBatchId column"
    else
        log_success "analysisBatchId column already exists"
    fi
    
    # Check and add colorBatchId
    if ! check_column_exists "Product" "colorBatchId"; then
        log_info "Adding colorBatchId column..."
        ./prisma-server.sh npx prisma db execute --stdin <<< "ALTER TABLE \"Product\" ADD COLUMN \"colorBatchId\" TEXT;"
        log_success "Added colorBatchId column"
    else
        log_success "colorBatchId column already exists"
    fi
    
    # Check and add batchProcessingStatus
    if ! check_column_exists "Product" "batchProcessingStatus"; then
        log_info "Adding batchProcessingStatus column..."
        ./prisma-server.sh npx prisma db execute --stdin <<< "ALTER TABLE \"Product\" ADD COLUMN \"batchProcessingStatus\" TEXT DEFAULT 'pending';"
        log_success "Added batchProcessingStatus column"
    else
        log_success "batchProcessingStatus column already exists"
    fi
}

# Function to add missing indexes
add_missing_indexes() {
    log_info "Adding missing indexes..."
    
    # Check if analysisBatchId index exists
    if ! ./prisma-server.sh npx prisma db execute --stdin <<< "SELECT indexname FROM pg_indexes WHERE tablename = 'Product' AND indexname = 'Product_analysisBatchId_key';" | grep -q "Product_analysisBatchId_key"; then
        log_info "Adding analysisBatchId unique index..."
        ./prisma-server.sh npx prisma db execute --stdin <<< "CREATE UNIQUE INDEX \"Product_analysisBatchId_key\" ON \"Product\"(\"analysisBatchId\");"
        log_success "Added analysisBatchId index"
    else
        log_success "analysisBatchId index already exists"
    fi
    
    # Check if colorBatchId index exists
    if ! ./prisma-server.sh npx prisma db execute --stdin <<< "SELECT indexname FROM pg_indexes WHERE tablename = 'Product' AND indexname = 'Product_colorBatchId_key';" | grep -q "Product_colorBatchId_key"; then
        log_info "Adding colorBatchId unique index..."
        ./prisma-server.sh npx prisma db execute --stdin <<< "CREATE UNIQUE INDEX \"Product_colorBatchId_key\" ON \"Product\"(\"colorBatchId\");"
        log_success "Added colorBatchId index"
    else
        log_success "colorBatchId index already exists"
    fi
}

# Function to validate schema
validate_schema() {
    log_info "Validating schema after fixes..."
    
    if check_column_exists "Product" "analysisBatchId" && \
       check_column_exists "Product" "colorBatchId" && \
       check_column_exists "Product" "batchProcessingStatus"; then
        log_success "✅ All required columns exist"
        return 0
    else
        log_error "❌ Schema validation failed"
        return 1
    fi
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

# Main function
main() {
    log_info "🔧 Starting force schema synchronization..."
    
    # Step 1: Add missing columns
    add_missing_columns
    
    # Step 2: Add missing indexes
    add_missing_indexes
    
    # Step 3: Validate schema
    if validate_schema; then
        log_success "Schema validation passed"
    else
        log_error "Schema validation failed"
        exit 1
    fi
    
    # Step 4: Regenerate Prisma client
    if regenerate_client; then
        log_success "Prisma client regenerated"
    else
        log_error "Prisma client regeneration failed"
        exit 1
    fi
    
    log_success "🎉 Schema synchronization completed successfully!"
    return 0
}

# Run main function
main "$@"
