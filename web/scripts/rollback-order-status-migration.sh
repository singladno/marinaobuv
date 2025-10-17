#!/bin/bash

# Rollback Order Status Migration Script
# This script rolls back the order status migration

set -e

echo "🔄 Starting Order Status Migration Rollback..."

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
echo "⚠️  WARNING: This will rollback the order status migration!"
echo "   This will convert Russian statuses back to English equivalents."
echo ""
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Rollback cancelled"
    exit 1
fi

echo ""
echo "🔄 Rolling back order status migration..."

# Rollback the migration
npx prisma db execute --stdin <<< "
-- Rollback: Convert Russian statuses back to English
UPDATE \"Order\" SET status = 'new' WHERE status = 'Новый';
UPDATE \"Order\" SET status = 'processing' WHERE status = 'Проверено';
UPDATE \"Order\" SET status = 'shipped' WHERE status = 'Отправлен';
UPDATE \"Order\" SET status = 'delivered' WHERE status = 'Выполнен';
UPDATE \"Order\" SET status = 'cancelled' WHERE status = 'Отменен';

-- Rollback any other Russian statuses to generic values
UPDATE \"Order\" SET status = 'processing' WHERE status = 'Наличие';
UPDATE \"Order\" SET status = 'processing' WHERE status = 'Согласование';
UPDATE \"Order\" SET status = 'processing' WHERE status = 'Согласован';
UPDATE \"Order\" SET status = 'processing' WHERE status = 'Купить';
UPDATE \"Order\" SET status = 'processing' WHERE status = 'Куплен';
UPDATE \"Order\" SET status = 'processing' WHERE status = 'Отправить';
UPDATE \"Order\" SET status = 'processing' WHERE status = 'Готов к отправке';
"

echo ""
echo "✅ Rollback completed successfully!"

echo ""
echo "📊 Updated order statuses in database:"
npx prisma db execute --stdin <<< "SELECT DISTINCT status, COUNT(*) as count FROM \"Order\" GROUP BY status ORDER BY count DESC;"

echo ""
echo "🎉 Order Status Migration rollback completed!"
echo ""
echo "⚠️  Note: You may need to restart your application and revert code changes"
echo "   to fully restore the previous status system."
