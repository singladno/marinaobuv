#!/usr/bin/env tsx
/**
 * Utility script to get URLs of latest product exports
 * Usage: npx tsx src/scripts/get-latest-export-urls.ts
 */

import fs from 'fs';
import path from 'path';
import { publicUrl } from '../lib/s3u';

interface ExportInfo {
  filename: string;
  format: 'csv' | 'xml';
  date: string;
  size: number;
  s3Url: string;
  localPath: string;
}

function getLatestExports(): ExportInfo[] {
  const exportsDir = path.join(process.cwd(), 'exports');
  const exports: ExportInfo[] = [];

  if (!fs.existsSync(exportsDir)) {
    console.log('⚠️  Exports directory does not exist');
    return [];
  }

  const files = fs.readdirSync(exportsDir);

  for (const file of files) {
    if (
      file.startsWith('products-export-') &&
      (file.endsWith('.csv') || file.endsWith('.xml'))
    ) {
      const filePath = path.join(exportsDir, file);
      const stats = fs.statSync(filePath);
      const format = file.endsWith('.csv') ? 'csv' : 'xml';

      // Extract date from filename
      const dateMatch = file.match(/products-export-(\d{4}-\d{2}-\d{2})/);
      const date = dateMatch ? dateMatch[1] : stats.mtime.toISOString().split('T')[0];

      // Generate S3 URL
      const s3Key = `exports/${file}`;
      const s3Url = publicUrl(s3Key);

      exports.push({
        filename: file,
        format,
        date,
        size: stats.size,
        s3Url,
        localPath: filePath,
      });
    }
  }

  // Sort by date (newest first)
  exports.sort((a, b) => b.date.localeCompare(a.date));

  return exports;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function main() {
  console.log('🔍 Searching for latest product exports...\n');

  const exports = getLatestExports();

  if (exports.length === 0) {
    console.log('❌ No export files found');
    console.log('💡 Run the export script first: npx tsx src/scripts/product-export-cron.ts');
    process.exit(1);
  }

  // Group by date
  const byDate = new Map<string, ExportInfo[]>();
  for (const exp of exports) {
    if (!byDate.has(exp.date)) {
      byDate.set(exp.date, []);
    }
    byDate.get(exp.date)!.push(exp);
  }

  // Show latest exports
  console.log('📦 Latest Product Exports:\n');
  console.log('═'.repeat(80));

  let shown = 0;
  for (const [date, files] of Array.from(byDate.entries()).slice(0, 5)) {
    console.log(`\n📅 Date: ${date}`);
    for (const file of files) {
      console.log(`\n  ${file.format.toUpperCase()}: ${file.filename}`);
      console.log(`  📊 Size: ${formatFileSize(file.size)}`);
      console.log(`  🔗 S3 URL: ${file.s3Url}`);
      console.log(`  📁 Local: ${file.localPath}`);
      shown++;
    }
  }

  if (exports.length > shown) {
    console.log(`\n... and ${exports.length - shown} more file(s)`);
  }

  // Show most recent URLs for easy copy-paste
  const latest = exports.slice(0, 2);
  console.log('\n' + '═'.repeat(80));
  console.log('\n🔗 Latest Export URLs (for sharing):\n');
  for (const exp of latest) {
    console.log(`${exp.format.toUpperCase()}: ${exp.s3Url}`);
  }

  console.log('\n✅ Done!');
}

main();
