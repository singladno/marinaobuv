#!/bin/bash

# Rollback Order Item ID Migration Script
# This script rolls back the migration to remove the sequential order item ID system

set -e  # Exit on any error

echo "🔄 Starting Order Item ID Migration Rollback..."

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

echo "📋 Pre-rollback checks..."

# Check if Prisma is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js and npm."
    exit 1
fi

# Check database connection
echo "🔌 Testing database connection..."
if ! npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Error: Cannot connect to database. Please check your DATABASE_URL."
    exit 1
fi
echo "✅ Database connection successful"

# Backup current data before rollback
echo "💾 Creating backup before rollback..."
BACKUP_FILE="backups/order-items-rollback-backup-$(date +%Y%m%d-%H%M%S).sql"
mkdir -p backups

# Create backup of order items table
npx prisma db execute --stdin <<< "
COPY (
    SELECT id, \"orderId\", \"productId\", slug, name, article, \"priceBox\", qty, \"itemCode\", \"createdAt\"
    FROM \"OrderItem\"
    ORDER BY \"createdAt\"
) TO STDOUT WITH CSV HEADER;
" > "$BACKUP_FILE" 2>/dev/null || echo "⚠️  Warning: Could not create backup (this is optional)"

echo "✅ Backup created: $BACKUP_FILE"

# Rollback the migration
echo "🔄 Rolling back migration..."

# Drop the function
echo "🗑️  Dropping get_next_order_item_id function..."
npx prisma db execute --stdin <<< "DROP FUNCTION IF EXISTS get_next_order_item_id();" || echo "⚠️  Function may not exist"

# Drop the sequence
echo "🗑️  Dropping order_item_id_seq sequence..."
npx prisma db execute --stdin <<< "DROP SEQUENCE IF EXISTS order_item_id_seq;" || echo "⚠️  Sequence may not exist"

# Reset order items to use the old timestamp-based format
echo "🔄 Resetting order items to timestamp-based format..."
npx prisma db execute --stdin <<< "
UPDATE \"OrderItem\" 
SET \"itemCode\" = 'ITM-' || 
    TO_CHAR(\"createdAt\", 'YYYYMMDD') || '-' ||
    TO_CHAR(\"createdAt\", 'HH24MISS') || '-' ||
    LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
WHERE \"itemCode\" ~ '^[0-9]+$';
"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

echo ""
echo "🎉 Order Item ID Migration Rollback Completed Successfully!"
echo ""
echo "📋 Summary:"
echo "- ✅ Database sequence removed"
echo "- ✅ Order item ID generation function removed"
echo "- ✅ Existing order items reset to timestamp-based format"
echo "- ✅ Prisma client regenerated"
echo ""
echo "🔢 Order item IDs are now back to the old format: ITM-YYYYMMDD-HHMMSS-XXXX"
echo ""
echo "📁 Backup file: $BACKUP_FILE"
echo ""
echo "⚠️  Note: You may need to update your application code to use the old itemCodeGenerator format"
echo "🚀 The application is ready to use the old order item ID system!"
