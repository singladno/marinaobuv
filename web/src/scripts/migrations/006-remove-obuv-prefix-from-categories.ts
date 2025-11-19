#!/usr/bin/env tsx

// Load environment variables from .env BEFORE any other imports
import '../load-env';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Migration: Remove 'obuv/' prefix from category paths
 *
 * This migration updates all category paths that start with 'obuv/'
 * to remove that prefix, making the system work with any root category.
 *
 * Example:
 *   - Before: 'obuv/womens/autumn/sneakers'
 *   - After:  'womens/autumn/sneakers'
 */
async function removeObuvPrefix() {
  console.log('🔄 Removing "obuv/" prefix from category paths...');

  // Get all categories with paths starting with 'obuv/'
  const categories = await prisma.category.findMany({
    where: {
      path: {
        startsWith: 'obuv/',
      },
    },
    orderBy: {
      path: 'asc', // Process from root to leaves
    },
  });

  console.log(`📊 Found ${categories.length} categories to update`);

  if (categories.length === 0) {
    console.log('✅ No categories need updating');
    return;
  }

  let updatedCount = 0;
  let errorCount = 0;

  // Update each category path
  for (const category of categories) {
    const oldPath = category.path;
    const newPath = oldPath.replace(/^obuv\//, '');

    if (oldPath === newPath) {
      console.log(`  ⚠️  Skipping: ${oldPath} (no prefix to remove)`);
      continue;
    }

    try {
      // Check if a category with the new path already exists
      const existing = await prisma.category.findUnique({
        where: { path: newPath },
      });

      if (existing) {
        console.log(
          `  ⚠️  Skipping: ${oldPath} → ${newPath} (target path already exists)`
        );
        errorCount++;
        continue;
      }

      // Update the category path
      await prisma.category.update({
        where: { id: category.id },
        data: { path: newPath },
      });

      updatedCount++;
      console.log(`  ✅ Updated: ${oldPath} → ${newPath}`);
    } catch (error) {
      console.error(`  ❌ Error updating ${oldPath}:`, error);
      errorCount++;
    }
  }

  console.log(`\n📊 Migration results:`);
  console.log(`  - Updated: ${updatedCount}`);
  console.log(`  - Errors: ${errorCount}`);
  console.log(`  - Total: ${categories.length}`);
}

export async function up() {
  console.log('🚀 Running migration: 006-remove-obuv-prefix-from-categories');

  try {
    await removeObuvPrefix();
    console.log('✅ Migration 006-remove-obuv-prefix-from-categories completed successfully!');
  } catch (error) {
    console.error('❌ Migration 006-remove-obuv-prefix-from-categories failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export async function down() {
  console.log('🔄 Rolling back migration: 006-remove-obuv-prefix-from-categories');
  console.log('⚠️  This migration cannot be automatically rolled back.');
  console.log('   If needed, manually add "obuv/" prefix back to category paths.');
  await prisma.$disconnect();
}

// Run migration if called directly (for testing)
// The migration system will call up() automatically
if (process.argv[1]?.includes('006-remove-obuv-prefix-from-categories')) {
  up()
    .then(() => {
      console.log('✅ Migration completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}
