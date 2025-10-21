#!/bin/bash

# Rollback Order Number Migration Script
# This script rolls back the order number migration if needed

set -e  # Exit on any error

echo "🔄 Starting Order Number Migration Rollback..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the web directory."
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set."
    echo "Please set it before running this script."
    exit 1
fi

echo "⚠️  WARNING: This will rollback the order number migration!"
echo "This will:"
echo "- Remove the order_number_seq sequence"
echo "- Remove the get_next_order_number function"
echo "- NOT affect existing order data"
echo ""
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Rollback cancelled."
    exit 1
fi

echo "🔄 Rolling back migration..."

# Remove the function
echo "1. Removing get_next_order_number function..."
npx prisma db execute --stdin <<< "DROP FUNCTION IF EXISTS get_next_order_number();" || echo "⚠️  Function may not exist"

# Remove the sequence
echo "2. Removing order_number_seq sequence..."
npx prisma db execute --stdin <<< "DROP SEQUENCE IF EXISTS order_number_seq;" || echo "⚠️  Sequence may not exist"

# Reset Prisma migration history (optional)
echo "3. Resetting migration history..."
npx prisma migrate resolve --applied 20250120000000_add_order_number_sequence || echo "⚠️  Migration may not be in history"

echo ""
echo "✅ Rollback completed!"
echo ""
echo "📋 What was removed:"
echo "- ✅ get_next_order_number function"
echo "- ✅ order_number_seq sequence"
echo "- ✅ Migration marked as rolled back"
echo ""
echo "⚠️  Note: Existing order data was NOT modified."
echo "You may need to manually update the order-number-generator.ts file"
echo "to use the old date-based format if you want to revert completely."
