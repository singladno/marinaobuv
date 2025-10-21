#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { writeFileSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';

const BACKUP_DIR = './backups';
const MAX_BACKUPS = 3;

function createBackup() {
  try {
    console.log('🔄 Starting database backup...');

    // Ensure backup directory exists
    execSync(`mkdir -p ${BACKUP_DIR}`, { stdio: 'inherit' });

    // Create timestamp for backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = join(BACKUP_DIR, `backup-${timestamp}.sql`);

    // Get database URL from environment
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Extract database connection details from URL
    const url = new URL(databaseUrl);
    const host = url.hostname;
    const port = url.port || '5432';
    const database = url.pathname.slice(1); // Remove leading slash
    const username = url.username;
    const password = url.password;

    // Set PGPASSWORD environment variable for pg_dump
    process.env.PGPASSWORD = password;

    // Create backup using pg_dump
    const pgDumpCommand = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} --no-password --verbose`;

    console.log(`📦 Creating backup: ${backupFile}`);
    execSync(`${pgDumpCommand} > ${backupFile}`, {
      stdio: 'inherit',
      env: { ...process.env, PGPASSWORD: password }
    });

    console.log('✅ Database backup completed successfully');

    // Clean up old backups (keep only MAX_BACKUPS)
    cleanupOldBackups();

    console.log(`📁 Backup saved to: ${backupFile}`);

  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  }
}

function cleanupOldBackups() {
  try {
    const files = readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
      .map(file => ({
        name: file,
        path: join(BACKUP_DIR, file),
        mtime: statSync(join(BACKUP_DIR, file)).mtime
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    if (files.length > MAX_BACKUPS) {
      const filesToDelete = files.slice(MAX_BACKUPS);
      console.log(`🧹 Cleaning up ${filesToDelete.length} old backup(s)...`);

      filesToDelete.forEach(file => {
        console.log(`🗑️  Deleting old backup: ${file.name}`);
        unlinkSync(file.path);
      });
    }
  } catch (error) {
    console.error('⚠️  Warning: Failed to cleanup old backups:', error);
  }
}

// Run backup
createBackup();
