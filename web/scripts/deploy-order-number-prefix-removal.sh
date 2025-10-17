#!/bin/bash

# Deploy Order Number Prefix Removal Script
# This script removes the "ORD-" prefix from order numbers, leaving only numbers

set -e

echo "🚀 Starting Order Number Prefix Removal Deployment..."

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

echo "📋 Current order numbers in database (showing first 10):"
npx prisma db execute --stdin <<< "SELECT \"orderNumber\", \"createdAt\" FROM \"Order\" ORDER BY \"createdAt\" DESC LIMIT 10;"

echo ""
echo "🔄 Applying order number prefix removal migration..."

# Apply the migration
npx prisma db execute --file ./prisma/migrations/20250120000002_remove_ord_prefix/migration.sql

echo ""
echo "✅ Migration applied successfully!"

echo ""
echo "📊 Updated order numbers in database (showing first 10):"
npx prisma db execute --stdin <<< "SELECT \"orderNumber\", \"createdAt\" FROM \"Order\" ORDER BY \"createdAt\" DESC LIMIT 10;"

echo ""
echo "🔍 Verifying database function:"
npx prisma db execute --stdin <<< "SELECT get_next_order_number() as next_order_number;"

echo ""
echo "🎉 Order Number Prefix Removal completed successfully!"
echo ""
echo "📝 Summary of changes:"
echo "   • Removed 'ORD-' prefix from all existing order numbers"
echo "   • Updated database function to return numbers only"
echo "   • Updated TypeScript code to work with numeric-only order numbers"
echo "   • Order numbers now start from 10000 and increment sequentially"
echo ""
echo "🔧 Next steps:"
echo "   1. Restart your application to use the updated order number system"
echo "   2. Verify that new orders are created with numeric-only order numbers"
echo "   3. Test the order number generation functionality"
echo ""
echo "⚠️  Note: All existing orders now have numeric-only order numbers"
echo "   (e.g., 'ORD-10001' became '10001')"
