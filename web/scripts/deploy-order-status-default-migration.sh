#!/bin/bash

# Deploy Order Status Default Migration Script
# This script updates the default order status from "new" to "Новый"

set -e

echo "🚀 Starting Order Status Default Migration..."

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
echo "🔄 Applying order status default migration..."

# Apply the migration
npx prisma db execute --file ./prisma/migrations/20250120000003_update_order_status_default/migration.sql

echo ""
echo "✅ Migration applied successfully!"

echo ""
echo "📊 Updated order statuses in database:"
npx prisma db execute --stdin <<< "SELECT DISTINCT status, COUNT(*) as count FROM \"Order\" GROUP BY status ORDER BY count DESC;"

echo ""
echo "🔍 Verifying default value:"
npx prisma db execute --stdin <<< "SELECT column_default FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'status';"

echo ""
echo "🎉 Order Status Default Migration completed successfully!"
echo ""
echo "📝 Summary of changes:"
echo "   • Updated default order status from 'new' to 'Новый'"
echo "   • Updated any existing orders with 'new' status to 'Новый'"
echo "   • New orders will now be created with 'Новый' status by default"
echo ""
echo "🔧 Next steps:"
echo "   1. Restart your application to use the updated default status"
echo "   2. Verify that new orders are created with 'Новый' status"
echo "   3. Test the order creation functionality"
