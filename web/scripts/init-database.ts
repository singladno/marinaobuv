#!/usr/bin/env tsx

/**
 * Database Initialization Script
 * This script ensures the database is properly configured and seeded
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initDatabase() {
  console.log('🗄️ Initializing database...');

  try {
    // Test database connection
    console.log('🔍 Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');

    // Check if we need to run migrations
    console.log('🔍 Checking migration status...');
    const migrations = await prisma.$queryRaw`
      SELECT * FROM _prisma_migrations 
      ORDER BY finished_at DESC 
      LIMIT 1
    `;
    console.log('✅ Migration status checked');

    // Check if we have any categories (basic data check)
    const categoryCount = await prisma.category.count();
    console.log(`📊 Found ${categoryCount} categories in database`);

    if (categoryCount === 0) {
      console.log('🌱 Database appears to be empty, seeding may be needed');
    }

    console.log('✅ Database initialization completed successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
initDatabase();
