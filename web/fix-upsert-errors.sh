#!/bin/bash

echo "🔧 Fixing upsert errors in all files..."

# Fix parsing-progress route
sed -i.tmp 's/data: updateData,/update: updateData,\
        create: {\
          id: record.id,\
          ...updateData,\
        },/g' src/app/api/admin/parsing-progress/route.ts

# Fix cleanup-stuck-parsing script
sed -i.tmp 's/data: {/update: {/g' src/scripts/cleanup-stuck-parsing.ts
sed -i.tmp '/update: {/a\
        create: {\
          id: record.id,\
          status: "failed",\
          completedAt: now,\
          errorMessage: "Process timeout - automatically cleaned up",\
          duration: duration,\
        },' src/scripts/cleanup-stuck-parsing.ts

# Fix test-parallel-parsing
sed -i.tmp 's/data: {/update: {/g' src/scripts/test-parallel-parsing.ts
sed -i.tmp '/update: {/a\
        create: {\
          id: "test-parsing-1",\
          status: "running",\
          startedAt: new Date(),\
        },' src/scripts/test-parallel-parsing.ts

# Fix test-parsing-monitoring
sed -i.tmp 's/data: {/update: {/g' src/scripts/test-parsing-monitoring.ts
sed -i.tmp '/update: {/a\
        create: {\
          id: "test-monitoring-1",\
          status: "running",\
          startedAt: new Date(),\
        },' src/scripts/test-parsing-monitoring.ts

# Fix update-parsing-status
sed -i.tmp 's/data: updateData,/update: updateData,\
        create: {\
          id: record.id,\
          ...updateData,\
        },/g' src/scripts/update-parsing-status.ts

# Clean up temp files
rm -f src/**/*.tmp

echo "✅ All upsert errors fixed!"

