#!/bin/bash

# Deployment script for refusal reason field migration
# This script safely adds the refusalReason field to OrderItemFeedback table

set -e  # Exit on any error

echo "🚀 Starting refusal reason field migration..."

# Check if we're in the right directory
if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ Error: Please run this script from the web directory"
    exit 1
fi

# Check if the field already exists
echo "🔍 Checking if refusalReason field already exists..."
FIELD_EXISTS=$(psql $DATABASE_URL -t -c "SELECT column_name FROM information_schema.columns WHERE table_name='OrderItemFeedback' AND column_name='refusalReason';" 2>/dev/null || echo "")

if [ ! -z "$FIELD_EXISTS" ]; then
    echo "✅ refusalReason field already exists, skipping migration"
    exit 0
fi

# Apply the migration
echo "📝 Adding refusalReason field to OrderItemFeedback table..."
psql $DATABASE_URL -c "ALTER TABLE \"OrderItemFeedback\" ADD COLUMN \"refusalReason\" TEXT;"

# Verify the migration
echo "✅ Verifying migration..."
psql $DATABASE_URL -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='OrderItemFeedback' AND column_name='refusalReason';"

echo "🎉 Migration completed successfully!"
echo "📋 The refusalReason field has been added to the OrderItemFeedback table"
echo "🔧 You can now use the refusal functionality in the application"
