#!/bin/bash

# Rollback Order Status Default Migration Script
# This script rolls back the order status default migration

set -e

echo "🔄 Starting Order Status Default Migration Rollback..."

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the web directory"
    exit 1
fi

# Check if Prisma is available
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx is not available"
    exit 1
fi

echo "📋 Current order statuses in database:"
npx prisma db execute --stdin <<< "SELECT DISTINCT status, COUNT(*) as count FROM \"Order\" GROUP BY status ORDER BY count DESC;"

echo ""
echo "⚠️  WARNING: This will rollback the order status default migration!"
echo "   This will change the default status back to 'new' and update 'Новый' to 'new'."
echo ""
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Rollback cancelled"
    exit 1
fi

echo ""
echo "🔄 Rolling back order status default migration..."

# Rollback the migration
npx prisma db execute --stdin <<< "
-- Rollback: Change default value back to 'new'
ALTER TABLE \"Order\" ALTER COLUMN \"status\" SET DEFAULT 'new';

-- Rollback: Update 'Новый' status back to 'new'
UPDATE \"Order\" SET \"status\" = 'new' WHERE \"status\" = 'Новый';
"

echo ""
echo "✅ Rollback completed successfully!"

echo ""
echo "📊 Updated order statuses in database:"
npx prisma db execute --stdin <<< "SELECT DISTINCT status, COUNT(*) as count FROM \"Order\" GROUP BY status ORDER BY count DESC;"

echo ""
echo "🔍 Verifying default value:"
npx prisma db execute --stdin <<< "SELECT column_default FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'status';"

echo ""
echo "🎉 Order Status Default Migration rollback completed!"
echo ""
echo "⚠️  Note: You may need to restart your application and revert code changes"
echo "   to fully restore the previous status system with 'new' as default."
