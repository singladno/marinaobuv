#!/usr/bin/env tsx

// Load environment variables from .env BEFORE any other imports
import './load-env';

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

interface MigrationRecord {
  id: string;
  name: string;
  executedAt: Date;
}

async function runPrismaMigrations() {
  console.log('🚀 Running Prisma migrations...');

  try {
    // Run Prisma migrations
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    console.log('✅ Prisma migrations completed successfully');
  } catch (error) {
    console.error('❌ Prisma migrations failed:', error);
    throw error;
  }
}

async function getExecutedMigrations(): Promise<MigrationRecord[]> {
  try {
    const migrations = await prisma.$queryRaw<MigrationRecord[]>`
      SELECT id, name, "executedAt" FROM "MigrationHistory" ORDER BY "executedAt" ASC
    `;
    return migrations;
  } catch (error) {
    // Table doesn't exist yet, return empty array
    return [];
  }
}

async function markMigrationAsExecuted(migrationName: string) {
  try {
    await prisma.$executeRaw`
      INSERT INTO "MigrationHistory" (id, name, "executedAt") 
      VALUES (gen_random_uuid(), ${migrationName}, NOW())
      ON CONFLICT (name) DO NOTHING
    `;
  } catch (error) {
    console.warn(`⚠️ Could not mark migration as executed: ${error}`);
  }
}

async function getMigrationFiles(): Promise<string[]> {
  const migrationsDir = join(process.cwd(), 'src/scripts/migrations');

  try {
    const files = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.ts'))
      .sort(); // Sort to ensure proper order

    return files;
  } catch (error) {
    console.log('📁 No migrations directory found, skipping data migrations');
    return [];
  }
}

async function runDataMigration(migrationFile: string) {
  const migrationName = migrationFile.replace('.ts', '');
  console.log(`🔄 Running data migration: ${migrationName}`);

  try {
    // Import the migration module
    const migrationPath = join(
      process.cwd(),
      'src/scripts/migrations',
      migrationFile
    );
    const migration = await import(migrationPath);

    if (typeof migration.up === 'function') {
      await migration.up();
      await markMigrationAsExecuted(migrationName);
      console.log(`✅ Data migration ${migrationName} completed`);
    } else {
      console.log(
        `⚠️ Migration ${migrationName} has no 'up' function, skipping`
      );
    }
  } catch (error) {
    console.error(`❌ Data migration ${migrationName} failed:`, error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting centralized migration system...');
  console.log('📋 This will:');
  console.log('  1. Run Prisma schema migrations');
  console.log('  2. Run data migrations from migrations directory');
  console.log('  3. Track executed migrations');
  console.log('');

  try {
    // Step 1: Run Prisma migrations
    console.log('📝 Step 1: Running Prisma migrations...');
    await runPrismaMigrations();

    // Step 2: Get executed migrations
    console.log('\n📝 Step 2: Checking executed data migrations...');
    const executedMigrations = await getExecutedMigrations();
    const executedNames = executedMigrations.map(m => m.name);
    console.log(
      `📊 Found ${executedMigrations.length} previously executed migrations`
    );

    // Step 3: Get available migration files
    console.log('\n📝 Step 3: Discovering migration files...');
    const migrationFiles = await getMigrationFiles();
    console.log(`📊 Found ${migrationFiles.length} migration files`);

    // Step 4: Run pending data migrations
    console.log('\n📝 Step 4: Running pending data migrations...');
    let executedCount = 0;
    let skippedCount = 0;

    for (const migrationFile of migrationFiles) {
      const migrationName = migrationFile.replace('.ts', '');

      if (executedNames.includes(migrationName)) {
        console.log(
          `⏭️  Skipping already executed migration: ${migrationName}`
        );
        skippedCount++;
        continue;
      }

      await runDataMigration(migrationFile);
      executedCount++;
    }

    // Step 5: Show final statistics
    console.log('\n📊 Final statistics:');
    console.log(`  - Prisma migrations: ✅ Completed`);
    console.log(`  - Data migrations executed: ${executedCount}`);
    console.log(`  - Data migrations skipped: ${skippedCount}`);
    console.log(`  - Total migration files: ${migrationFiles.length}`);

    console.log('\n✅ Centralized migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Migration interrupted by user');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Migration terminated');
  await prisma.$disconnect();
  process.exit(0);
});

main()
  .catch(error => {
    console.error('❌ Fatal error in migration:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
