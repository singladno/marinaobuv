#!/bin/bash

# Script to fix all parsingHistory.update to upsert
echo "🔧 Fixing parsingHistory.update to upsert in all files..."

# List of files to fix
files=(
  "src/app/api/admin/cleanup-stuck-parsing/route.ts"
  "src/app/api/admin/parsing-progress/route.ts"
  "src/scripts/test-parallel-parsing.ts"
  "src/scripts/test-parsing-monitoring.ts"
  "src/scripts/cleanup-stuck-parsing.ts"
  "src/scripts/update-parsing-status.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Create backup
    cp "$file" "$file.backup"
    
    # Replace parsingHistory.update with upsert pattern
    # This is a simplified replacement - may need manual adjustment
    sed -i.tmp 's/await prisma\.parsingHistory\.update({/await prisma.parsingHistory.upsert({/g' "$file"
    
    # Remove temp file
    rm -f "$file.tmp"
    
    echo "✅ Fixed $file"
  else
    echo "⚠️  File not found: $file"
  fi
done

echo "🎉 All files processed!"
echo "⚠️  Please review the changes and manually add the 'create' clause to each upsert call"

