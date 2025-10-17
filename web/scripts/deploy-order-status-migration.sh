#!/bin/bash

# Deploy Order Status Migration Script
# This script applies the order status migration to update existing orders

set -e

echo "🚀 Starting Order Status Migration Deployment..."

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
echo "🔄 Applying order status migration..."

# Apply the migration
npx prisma db execute --file ./prisma/migrations/20250120000001_update_order_statuses/migration.sql

echo ""
echo "✅ Migration applied successfully!"

echo ""
echo "📊 Updated order statuses in database:"
npx prisma db execute --stdin <<< "SELECT DISTINCT status, COUNT(*) as count FROM \"Order\" GROUP BY status ORDER BY count DESC;"

echo ""
echo "🎉 Order Status Migration completed successfully!"
echo ""
echo "📝 Summary of changes:"
echo "   • Updated old English statuses to new Russian statuses"
echo "   • Standardized all status values to match the new system"
echo "   • Excluded 'резервировать' and 'зарезервирован' as requested"
echo ""
echo "🔧 Next steps:"
echo "   1. Restart your application to use the new status system"
echo "   2. Verify that the UI components display the new statuses correctly"
echo "   3. Test the status change functionality"
