import {
  exportProducts,
  getLastExportDate,
  saveLastExportDate,
} from '../lib/services/product-export-service';
import { prisma } from '../lib/server/db';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Setup file logging for product export
 * Logs to web/logs/product-export.log
 */
function setupFileLogging(): {
  logStream: fs.WriteStream;
  originalLog: typeof console.log;
  originalError: typeof console.error;
} {
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const logFile = path.join(logsDir, 'product-export.log');
  const logStream = fs.createWriteStream(logFile, { flags: 'a' }); // 'a' flag appends

  const timestamp = () => new Date().toISOString();

  // Save original console methods
  const originalLog = console.log;
  const originalError = console.error;

  // Override console.log
  console.log = (...args: any[]) => {
    const message = args
      .map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      )
      .join(' ');
    const logMessage = `[${timestamp()}] ${message}\n`;
    logStream.write(logMessage);
    originalLog(...args);
  };

  // Override console.error
  console.error = (...args: any[]) => {
    const message = args
      .map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      )
      .join(' ');
    const logMessage = `[${timestamp()}] ERROR: ${message}\n`;
    logStream.write(logMessage);
    originalError(...args);
  };

  console.log(`📝 Logging to: ${logFile}`);

  return { logStream, originalLog, originalError };
}

/**
 * Restore original console methods
 */
function restoreConsole(
  logStream: fs.WriteStream,
  originalLog: typeof console.log,
  originalError: typeof console.error
) {
  console.log = originalLog;
  console.error = originalError;
  logStream.end();
}

/**
 * Daily Product Export Cron Job
 * Exports only new/updated products since last export to CSV and XML formats
 * On first run (no lastExportDate), exports all products to create initial export
 * Subsequent runs export only products created/updated since last export
 * Designed for integration with Bitrix or other external systems
 *
 * This cron job is automatically installed during deployment via scripts/install-crons.sh
 * Configuration: scripts/cron-jobs.conf (runs daily at 02:00)
 */
async function main() {
  // Setup file logging
  const { logStream, originalLog, originalError } = setupFileLogging();

  try {
    console.log('🚀 Starting daily product export...');

    // Get last export date
    const lastExportDate = getLastExportDate();
    // Always export only new products (if lastExportDate exists)
    // If no last export date, this is the first run - export all products
    const onlyNew = !!lastExportDate;

    if (onlyNew) {
      console.log(`📅 Last export was at: ${lastExportDate.toISOString()}`);
      console.log('📦 Exporting only new/updated products since last export');
    } else {
      console.log('📦 First export - exporting all active products');
      console.log(
        '⚠️  Note: Subsequent exports will only include new/updated products'
      );
    }

    // Generate shared timestamp for both CSV and XML to ensure they group together
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now
      .toISOString()
      .split('T')[1]
      .split('.')[0]
      .replace(/:/g, '-'); // HH-MM-SS
    const sharedTimestamp = `${dateStr}-${timeStr}`;

    // Export to CSV (most common format for Bitrix)
    console.log('📄 Exporting to CSV format...');
    const csvResult = await exportProducts({
      format: 'csv',
      onlyNew,
      lastExportDate: lastExportDate || undefined,
      sharedTimestamp,
    });

    console.log(
      `✅ CSV export completed: ${csvResult.productCount} products exported`
    );
    console.log(`📁 File saved to: ${csvResult.filePath}`);
    if (csvResult.s3Url) {
      console.log(`☁️  File uploaded to S3: ${csvResult.s3Url}`);
    }

    // Export to XML (alternative format)
    console.log('📄 Exporting to XML format...');
    const xmlResult = await exportProducts({
      format: 'xml',
      onlyNew,
      lastExportDate: lastExportDate || undefined,
      sharedTimestamp,
    });

    console.log(
      `✅ XML export completed: ${xmlResult.productCount} products exported`
    );
    console.log(`📁 File saved to: ${xmlResult.filePath}`);
    if (xmlResult.s3Url) {
      console.log(`☁️  File uploaded to S3: ${xmlResult.s3Url}`);
    }

    // Save last export date
    saveLastExportDate(new Date());

    console.log('✅ Daily product export completed successfully!');
    console.log(`📊 Total products exported: ${csvResult.productCount}`);

    // Clean up old export files (keep last 7 days)
    const exportsDir = path.join(process.cwd(), 'exports');
    if (fs.existsSync(exportsDir)) {
      const files = fs.readdirSync(exportsDir);
      const now = Date.now();
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

      let deletedCount = 0;
      for (const file of files) {
        if (
          file.startsWith('products-export-') &&
          (file.endsWith('.csv') || file.endsWith('.xml'))
        ) {
          const filePath = path.join(exportsDir, file);
          const stats = fs.statSync(filePath);
          if (stats.mtime.getTime() < sevenDaysAgo) {
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        }
      }

      if (deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedCount} old export file(s)`);
      }
    }
  } catch (error) {
    console.error('❌ Error during product export:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  } finally {
    restoreConsole(logStream, originalLog, originalError);
    await prisma.$disconnect();
  }
}

// Run the export
main()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
