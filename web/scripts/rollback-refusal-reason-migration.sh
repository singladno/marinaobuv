#!/bin/bash

# Rollback script for refusal reason field migration
# This script safely removes the refusalReason field from OrderItemFeedback table

set -e  # Exit on any error

echo "🔄 Starting rollback of refusal reason field migration..."

# Check if we're in the right directory
if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ Error: Please run this script from the web directory"
    exit 1
fi

# Check if the field exists
echo "🔍 Checking if refusalReason field exists..."
FIELD_EXISTS=$(psql $DATABASE_URL -t -c "SELECT column_name FROM information_schema.columns WHERE table_name='OrderItemFeedback' AND column_name='refusalReason';" 2>/dev/null || echo "")

if [ -z "$FIELD_EXISTS" ]; then
    echo "ℹ️  refusalReason field doesn't exist, nothing to rollback"
    exit 0
fi

# Confirm rollback
echo "⚠️  WARNING: This will remove the refusalReason field and all data in it!"
echo "Are you sure you want to continue? (yes/no)"
read -r confirmation

if [ "$confirmation" != "yes" ]; then
    echo "❌ Rollback cancelled"
    exit 0
fi

# Remove the field
echo "🗑️  Removing refusalReason field from OrderItemFeedback table..."
psql $DATABASE_URL -c "ALTER TABLE \"OrderItemFeedback\" DROP COLUMN \"refusalReason\";"

# Verify the rollback
echo "✅ Verifying rollback..."
FIELD_EXISTS_AFTER=$(psql $DATABASE_URL -t -c "SELECT column_name FROM information_schema.columns WHERE table_name='OrderItemFeedback' AND column_name='refusalReason';" 2>/dev/null || echo "")

if [ -z "$FIELD_EXISTS_AFTER" ]; then
    echo "🎉 Rollback completed successfully!"
    echo "📋 The refusalReason field has been removed from the OrderItemFeedback table"
    echo "⚠️  Note: You'll need to revert the application code to the previous version"
else
    echo "❌ Rollback failed - field still exists"
    exit 1
fi
