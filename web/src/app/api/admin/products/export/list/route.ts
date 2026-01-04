import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import fs from 'fs';
import path from 'path';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';

import { authOptions } from '@/lib/auth';
import { publicUrl } from '@/lib/s3u';
import { env } from '@/lib/env';
import { s3Client } from '@/lib/s3u';

interface ExportFile {
  filename: string;
  format: 'csv' | 'xml';
  date: string;
  size: number;
  s3Url?: string;
  localPath?: string;
  productCount?: number;
}

interface GroupedExport {
  date: string;
  timestamp: string; // Full timestamp for sorting
  productCount?: number; // Total product count (same for CSV and XML from same run)
  csv?: {
    filename: string;
    size: number;
    s3Url?: string;
    localPath?: string;
    productCount?: number;
  };
  xml?: {
    filename: string;
    size: number;
    s3Url?: string;
    localPath?: string;
    productCount?: number;
  };
}

// Helper function to check if user has export access
function hasExportAccess(role: string): boolean {
  return role === 'ADMIN' || role === 'EXPORT_MANAGER';
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasExportAccess(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const exportsMap = new Map<string, ExportFile>();

    // Get files from S3 (primary source)
    if (s3Client) {
      try {
        console.log('🔍 Listing S3 exports from bucket:', env.S3_BUCKET);
        const allObjects: any[] = [];
        let continuationToken: string | undefined;

        // Handle pagination for S3 list
        do {
          const command = new ListObjectsV2Command({
            Bucket: env.S3_BUCKET,
            Prefix: 'exports/products-export-',
            ContinuationToken: continuationToken,
            MaxKeys: 1000,
          });

          const response = await s3Client.send(command);

          if (response.Contents) {
            allObjects.push(...response.Contents);
          }

          continuationToken = response.NextContinuationToken;
        } while (continuationToken);

        console.log(`📦 Found ${allObjects.length} objects in S3 with prefix 'exports/products-export-'`);

        for (const object of allObjects) {
          if (!object.Key) continue;

          const filename = object.Key.replace('exports/', '');
          if (
            !filename.startsWith('products-export-') ||
            (!filename.endsWith('.csv') && !filename.endsWith('.xml'))
          ) {
            continue;
          }

            const format = filename.endsWith('.csv') ? 'csv' : 'xml';
            // Match both old format (YYYY-MM-DD) and new format (YYYY-MM-DD-HH-MM-SS)
            const dateMatch = filename.match(/products-export-(\d{4}-\d{2}-\d{2})(?:-(\d{2}-\d{2}-\d{2}))?/);
            const date = dateMatch
              ? dateMatch[1] // Use date part only for grouping
              : object.LastModified
                ? object.LastModified.toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0];

          const s3Key = object.Key;
          const s3Url = publicUrl(s3Key);

          // Try to get product count from metadata file
          let productCount: number | undefined;
          try {
            const metadataKey = s3Key.replace(/\.(csv|xml)$/, '.meta.json');
            // Note: We can't easily read from S3 here without making additional requests
            // For now, we'll read from local metadata if available
            const localMetadataPath = path.join(
              process.cwd(),
              'exports',
              filename.replace(/\.(csv|xml)$/, '.meta.json')
            );
            if (fs.existsSync(localMetadataPath)) {
              const metadata = JSON.parse(
                fs.readFileSync(localMetadataPath, 'utf-8')
              );
              productCount = metadata.productCount;
            }
          } catch {
            // Ignore metadata read errors
          }

          exportsMap.set(filename, {
            filename,
            format,
            date,
            size: object.Size || 0,
            s3Url,
            productCount,
          });
        }

        console.log(`✅ Processed ${exportsMap.size} export files from S3`);
      } catch (s3Error) {
        console.error('❌ Error listing S3 exports:', s3Error);
        // Continue with local files if S3 fails
      }
    } else {
      console.warn('⚠️ S3 client not available, using local files only');
    }

    // Also check local files (for backward compatibility and development)
    const exportsDir = path.join(process.cwd(), 'exports');
    if (fs.existsSync(exportsDir)) {
      const files = fs.readdirSync(exportsDir);

      for (const file of files) {
        if (
          file.startsWith('products-export-') &&
          (file.endsWith('.csv') || file.endsWith('.xml'))
        ) {
          // Only add if not already in map (S3 takes precedence)
          if (!exportsMap.has(file)) {
            const filePath = path.join(exportsDir, file);
            const stats = fs.statSync(filePath);
            const format = file.endsWith('.csv') ? 'csv' : 'xml';

            // Extract date from filename (products-export-YYYY-MM-DD or products-export-YYYY-MM-DD-HH-MM-SS)
            const dateMatch = file.match(/products-export-(\d{4}-\d{2}-\d{2})(?:-(\d{2}-\d{2}-\d{2}))?/);
            const date = dateMatch
              ? dateMatch[1] // Use date part only for grouping
              : stats.mtime.toISOString().split('T')[0];

            // Check if file exists in S3
            const s3Key = `exports/${file}`;
            const s3Url = publicUrl(s3Key);

            // Try to get product count from metadata file
            let productCount: number | undefined;
            try {
              const metadataPath = filePath.replace(/\.(csv|xml)$/, '.meta.json');
              if (fs.existsSync(metadataPath)) {
                const metadata = JSON.parse(
                  fs.readFileSync(metadataPath, 'utf-8')
                );
                productCount = metadata.productCount;
              }
            } catch {
              // Ignore metadata read errors
            }

            exportsMap.set(file, {
              filename: file,
              format,
              date,
              size: stats.size,
              s3Url,
              localPath: filePath,
              productCount,
            });
          }
        }
      }
    }

    // Convert map to array and group by timestamp (date + time)
    const exportsArray = Array.from(exportsMap.values());

    // Group exports by timestamp (extract base timestamp from filename)
    const groupedMap = new Map<string, GroupedExport>();

    for (const exp of exportsArray) {
      // Extract timestamp from filename (products-export-YYYY-MM-DD or products-export-YYYY-MM-DD-HH-MM-SS)
      const timestampMatch = exp.filename.match(
        /products-export-(\d{4}-\d{2}-\d{2})(?:-(\d{2}-\d{2}-\d{2}))?/
      );
      // Use full timestamp if available, otherwise just date
      // This ensures CSV and XML from same run (with same timestamp) are grouped together
      const baseTimestamp = timestampMatch
        ? timestampMatch[1] + (timestampMatch[2] ? `-${timestampMatch[2]}` : '')
        : exp.date;

      if (!groupedMap.has(baseTimestamp)) {
        groupedMap.set(baseTimestamp, {
          date: exp.date,
          timestamp: baseTimestamp,
        });
      }

      const grouped = groupedMap.get(baseTimestamp)!;
      if (exp.format === 'csv') {
        grouped.csv = {
          filename: exp.filename,
          size: exp.size,
          s3Url: exp.s3Url,
          localPath: exp.localPath,
          productCount: exp.productCount,
        };
        // Set product count on grouped export (same for CSV and XML from same run)
        if (exp.productCount !== undefined) {
          grouped.productCount = exp.productCount;
        }
      } else {
        grouped.xml = {
          filename: exp.filename,
          size: exp.size,
          s3Url: exp.s3Url,
          localPath: exp.localPath,
          productCount: exp.productCount,
        };
        // Set product count on grouped export (same for CSV and XML from same run)
        if (exp.productCount !== undefined) {
          grouped.productCount = exp.productCount;
        }
      }
    }

    // Convert to array and sort by timestamp (newest first)
    const groupedExports = Array.from(groupedMap.values());
    groupedExports.sort((a, b) => {
      // Sort by full timestamp (including time if available)
      return b.timestamp.localeCompare(a.timestamp);
    });

    console.log(`📊 Returning ${groupedExports.length} grouped export entries`);

    return NextResponse.json({
      success: true,
      exports: groupedExports,
      count: groupedExports.length,
    });
  } catch (error) {
    console.error('Error listing exports:', error);
    return NextResponse.json(
      {
        error: 'Failed to list exports',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
