#!/bin/bash

# Rollback Order Number Prefix Removal Script
# This script rolls back the order number prefix removal migration

set -e

echo "🔄 Starting Order Number Prefix Removal Rollback..."

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
echo "⚠️  WARNING: This will rollback the order number prefix removal!"
echo "   This will add 'ORD-' prefix back to all order numbers."
echo ""
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Rollback cancelled"
    exit 1
fi

echo ""
echo "🔄 Rolling back order number prefix removal..."

# Rollback the migration
npx prisma db execute --stdin <<< "
-- Rollback: Add ORD- prefix back to order numbers
UPDATE \"Order\" 
SET \"orderNumber\" = 'ORD-' || \"orderNumber\"
WHERE \"orderNumber\" ~ '^\\d+$';

-- Restore the original function that returns ORD- prefix
CREATE OR REPLACE FUNCTION get_next_order_number() RETURNS TEXT AS \$\$
BEGIN
    RETURN 'ORD-' || nextval('order_number_seq')::TEXT;
END;
\$\$ LANGUAGE plpgsql;
"

echo ""
echo "✅ Rollback completed successfully!"

echo ""
echo "📊 Updated order numbers in database (showing first 10):"
npx prisma db execute --stdin <<< "SELECT \"orderNumber\", \"createdAt\" FROM \"Order\" ORDER BY \"createdAt\" DESC LIMIT 10;"

echo ""
echo "🔍 Verifying database function:"
npx prisma db execute --stdin <<< "SELECT get_next_order_number() as next_order_number;"

echo ""
echo "🎉 Order Number Prefix Removal rollback completed!"
echo ""
echo "⚠️  Note: You may need to restart your application and revert code changes"
echo "   to fully restore the previous order number system with ORD- prefix."
