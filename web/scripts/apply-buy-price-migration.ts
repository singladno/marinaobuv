#!/usr/bin/env tsx

/**
 * Apply buyPrice and sourceScreenshot migration directly to database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function applyMigration() {
  console.log('🚀 Applying buyPrice and sourceScreenshot migration...');

  try {
    // Check if columns already exist
    const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Product' 
      AND column_name IN ('buyPrice', 'sourceScreenshotUrl', 'sourceScreenshotKey')
    `;

    const existingColumns = columns.map(c => c.column_name);
    console.log(`📊 Existing columns: ${existingColumns.join(', ') || 'none'}`);

    // Apply migration
    if (!existingColumns.includes('buyPrice')) {
      console.log('➕ Adding buyPrice column...');
      await prisma.$executeRaw`
        ALTER TABLE "Product" ADD COLUMN "buyPrice" DECIMAL(10,2)
      `;
      console.log('✅ buyPrice column added');
    } else {
      console.log('⏭️  buyPrice column already exists');
    }

    if (!existingColumns.includes('sourceScreenshotUrl')) {
      console.log('➕ Adding sourceScreenshotUrl column...');
      await prisma.$executeRaw`
        ALTER TABLE "Product" ADD COLUMN "sourceScreenshotUrl" TEXT
      `;
      console.log('✅ sourceScreenshotUrl column added');
    } else {
      console.log('⏭️  sourceScreenshotUrl column already exists');
    }

    if (!existingColumns.includes('sourceScreenshotKey')) {
      console.log('➕ Adding sourceScreenshotKey column...');
      await prisma.$executeRaw`
        ALTER TABLE "Product" ADD COLUMN "sourceScreenshotKey" TEXT
      `;
      console.log('✅ sourceScreenshotKey column added');
    } else {
      console.log('⏭️  sourceScreenshotKey column already exists');
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
applyMigration();
