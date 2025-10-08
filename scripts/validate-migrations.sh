#!/bin/bash

# Migration Validation Script
# This script validates that migrations have been applied correctly

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

# Function to check if specific columns exist
check_column_exists() {
    local table="$1"
    local column="$2"
    
    log_info "Checking if column $column exists in table $table..."
    
    if ./prisma-server.sh npx prisma db execute --stdin <<< "SELECT $column FROM \"$table\" LIMIT 1;" > /dev/null 2>&1; then
        log_success "Column $column exists in $table"
        return 0
    else
        log_error "Column $column missing from $table"
        return 1
    fi
}

# Function to validate all expected schema changes
validate_schema_changes() {
    log_info "Validating schema changes..."
    
    local errors=0
    
    # Check Product table batch processing fields
    check_column_exists "Product" "analysisBatchId" || ((errors++))
    check_column_exists "Product" "colorBatchId" || ((errors++))
    check_column_exists "Product" "batchProcessingStatus" || ((errors++))
    
    # Check ParsingHistory table fields
    check_column_exists "ParsingHistory" "triggeredBy" || ((errors++))
    check_column_exists "ParsingHistory" "reason" || ((errors++))
    
    # Check GptBatchJob table
    check_column_exists "GptBatchJob" "id" || ((errors++))
    
    if [ $errors -eq 0 ]; then
        log_success "All schema validations passed"
        return 0
    else
        log_error "$errors schema validation(s) failed"
        return 1
    fi
}

# Function to check migration history
check_migration_history() {
    log_info "Checking migration history..."
    
    if ./prisma-server.sh npx prisma migrate status > /dev/null 2>&1; then
        log_success "Migration history is consistent"
        return 0
    else
        log_error "Migration history is inconsistent"
        return 1
    fi
}

# Function to test database connectivity
test_connectivity() {
    log_info "Testing database connectivity..."
    
    if ./prisma-server.sh npx prisma db pull --print > /dev/null 2>&1; then
        log_success "Database connectivity test passed"
        return 0
    else
        log_error "Database connectivity test failed"
        return 1
    fi
}

# Main validation function
main() {
    log_info "🔍 Starting migration validation..."
    
    local total_checks=0
    local passed_checks=0
    
    # Test 1: Database connectivity
    ((total_checks++))
    if test_connectivity; then
        ((passed_checks++))
    fi
    
    # Test 2: Migration history
    ((total_checks++))
    if check_migration_history; then
        ((passed_checks++))
    fi
    
    # Test 3: Schema validation
    ((total_checks++))
    if validate_schema_changes; then
        ((passed_checks++))
    fi
    
    # Summary
    echo ""
    log_info "📊 Validation Summary:"
    log_info "   Total checks: $total_checks"
    log_info "   Passed: $passed_checks"
    log_info "   Failed: $((total_checks - passed_checks))"
    
    if [ $passed_checks -eq $total_checks ]; then
        log_success "🎉 All migrations validated successfully!"
        return 0
    else
        log_error "❌ Some migrations failed validation"
        return 1
    fi
}

# Run main function
main "$@"
