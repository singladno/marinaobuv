#!/usr/bin/env tsx

/**
 * Database Recovery Script
 * This script attempts to recover the database from backup if needed
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function recoverDatabase() {
  console.log('🔧 Attempting database recovery...');

  try {
    // Check if database is accessible
    console.log('🔍 Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');

    // Check if we have any data
    const categoryCount = await prisma.category.count();
    console.log(`📊 Found ${categoryCount} categories in database`);

    if (categoryCount === 0) {
      console.log('⚠️ Database appears to be empty, checking for backups...');

      // Look for backup files
      const backupDir = path.join(process.cwd(), 'backups');
      if (fs.existsSync(backupDir)) {
        const backupFiles = fs
          .readdirSync(backupDir)
          .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
          .sort()
          .reverse();

        if (backupFiles.length > 0) {
          console.log(`📁 Found ${backupFiles.length} backup files`);
          console.log('💡 To restore from backup, run: npm run db:restore');
        } else {
          console.log('📁 No backup files found');
        }
      } else {
        console.log('📁 No backup directory found');
      }
    }

    console.log('✅ Database recovery check completed');
  } catch (error) {
    console.error('❌ Database recovery failed:', error);
    console.log('💡 Try running: npm run prisma:migrate:deploy');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the recovery
recoverDatabase();
