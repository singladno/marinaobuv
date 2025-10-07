#!/usr/bin/env tsx

/**
 * Database Backup Script
 * This script creates a backup of the database before migrations
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function backupDatabase() {
  console.log('💾 Creating database backup...');

  try {
    // Get database URL from environment
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not found in environment');
    }

    // Parse database URL to extract connection details
    const url = new URL(databaseUrl);
    const host = url.hostname;
    const port = url.port || '5432';
    const database = url.pathname.slice(1);
    const username = url.username;
    const password = url.password;

    // Create backup directory in project root (../backups relative to web/)
    const backupDir = path.resolve(process.cwd(), '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);

    // Set PGPASSWORD environment variable
    process.env.PGPASSWORD = password;

    // Create pg_dump command
    const pgDumpCommand = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} --no-password --clean --if-exists --create`;

    console.log('🔍 Running database backup...');
    execSync(`${pgDumpCommand} > ${backupFile}`, { stdio: 'inherit' });

    console.log(`✅ Database backup created: ${backupFile}`);

    // Clean up old backups (keep only last 3)
    const backupFiles = fs
      .readdirSync(backupDir)
      .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
      .sort()
      .reverse();

    if (backupFiles.length > 3) {
      const filesToDelete = backupFiles.slice(3);
      for (const file of filesToDelete) {
        fs.unlinkSync(path.join(backupDir, file));
        console.log(`🗑️ Deleted old backup: ${file}`);
      }
    }
  } catch (error) {
    console.error('❌ Database backup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the backup
backupDatabase();
