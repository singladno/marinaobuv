import { prisma } from '@/lib/server/db';
import { putBuffer } from '@/lib/s3u';
import fs from 'fs';
import path from 'path';

export interface ExportOptions {
  format: 'csv' | 'xml';
  onlyNew?: boolean; // Only export products created/updated since last export
  lastExportDate?: Date;
  outputPath?: string; // Optional file path to save export
  uploadToS3?: boolean; // Upload to S3 after creating file (default: true)
  sharedTimestamp?: string; // Shared timestamp for grouping CSV and XML from same export run
}

export interface ExportResult {
  filePath: string; // Local file path
  s3Key?: string; // S3 key if uploaded
  s3Url?: string; // Public S3 URL if uploaded
  productCount: number;
  format: 'csv' | 'xml';
  exportedAt: Date;
}

/**
 * Formats sizes from JSON to string representation
 */
function formatSizes(value: unknown): string {
  if (value === null || value === undefined) return '';
  try {
    // Array of objects like [{size: '36', count: 1}]
    if (Array.isArray(value)) {
      if (value.length === 0) return '';
      if (
        value.every(
          item => typeof item === 'object' && item && 'size' in (item as any)
        )
      ) {
        return (value as Array<{ size: string; count?: number }>)
          .map(v => `${v.size}${v.count ? `(${v.count})` : ''}`)
          .join(', ');
      }
      if (
        value.every(
          item => typeof item === 'string' || typeof item === 'number'
        )
      ) {
        return (value as Array<string | number>).map(String).join(', ');
      }
      return '';
    }

    // Object map like {"36": true, "37": true}
    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>);
      const available = entries
        .filter(([, v]) => v === true || v === 1)
        .map(([k]) => k);
      if (available.length) return available.join(', ');
      return '';
    }

    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }
    return '';
  } catch {
    return '';
  }
}

/**
 * Escapes CSV value properly
 */
function escapeCsvValue(value: unknown): string {
  const stringValue =
    value === null || value === undefined ? '' : String(value);
  const needsQuotes = /[",\n]/.test(stringValue);
  const escaped = stringValue.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

/**
 * Escapes XML value properly
 */
function escapeXmlValue(value: unknown): string {
  const stringValue =
    value === null || value === undefined ? '' : String(value);
  return stringValue
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Exports products to CSV format (Bitrix-compatible)
 */
async function exportToCsv(products: any[], outputPath: string): Promise<void> {
  const headers = [
    'ID',
    'Название',
    'Артикул',
    'Категория',
    'Цена (руб.)',
    'Валюта',
    'Материал',
    'Пол',
    'Сезон',
    'Описание',
    'Размеры',
    'Изображения',
    'Активен',
    'Дата создания',
    'Дата обновления',
    'URL',
  ];

  const rows = products.map(product => {
    const images =
      product.images
        ?.map((img: any) => img.url)
        .filter((url: string) => url && url.trim() !== '')
        .join(', ') || '';

    const categoryPath = product.category?.path || product.category?.name || '';
    const productUrl = product.slug
      ? `${process.env.NEXT_PUBLIC_SITE_URL || ''}/products/${product.slug}`
      : '';

    return [
      product.id,
      product.name,
      product.article || '',
      categoryPath,
      Number(product.pricePair),
      product.currency || 'RUB',
      product.material || '',
      product.gender || '',
      product.season || '',
      product.description || '',
      formatSizes(product.sizes),
      images,
      product.isActive ? 'Да' : 'Нет',
      product.createdAt.toISOString(),
      product.updatedAt.toISOString(),
      productUrl,
    ];
  });

  const csvLines = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map(row => row.map(escapeCsvValue).join(',')),
  ];

  fs.writeFileSync(outputPath, '\ufeff' + csvLines.join('\n'), 'utf-8'); // BOM for Excel UTF-8 support
}

/**
 * Exports products to XML format (Bitrix-compatible)
 */
async function exportToXml(products: any[], outputPath: string): Promise<void> {
  const xmlLines = ['<?xml version="1.0" encoding="UTF-8"?>', '<products>'];

  for (const product of products) {
    const images =
      product.images
        ?.map((img: any) => img.url)
        .filter((url: string) => url && url.trim() !== '') || [];

    const categoryPath = product.category?.path || product.category?.name || '';
    const productUrl = product.slug
      ? `${process.env.NEXT_PUBLIC_SITE_URL || ''}/products/${product.slug}`
      : '';

    xmlLines.push('  <product>');
    xmlLines.push(`    <id>${escapeXmlValue(product.id)}</id>`);
    xmlLines.push(`    <name>${escapeXmlValue(product.name)}</name>`);
    xmlLines.push(
      `    <article>${escapeXmlValue(product.article || '')}</article>`
    );
    xmlLines.push(`    <category>${escapeXmlValue(categoryPath)}</category>`);
    xmlLines.push(`    <price>${Number(product.pricePair)}</price>`);
    xmlLines.push(
      `    <currency>${escapeXmlValue(product.currency || 'RUB')}</currency>`
    );
    xmlLines.push(
      `    <material>${escapeXmlValue(product.material || '')}</material>`
    );
    xmlLines.push(
      `    <gender>${escapeXmlValue(product.gender || '')}</gender>`
    );
    xmlLines.push(
      `    <season>${escapeXmlValue(product.season || '')}</season>`
    );
    xmlLines.push(
      `    <description><![CDATA[${product.description || ''}]]></description>`
    );
    xmlLines.push(
      `    <sizes>${escapeXmlValue(formatSizes(product.sizes))}</sizes>`
    );
    xmlLines.push(
      `    <isActive>${product.isActive ? 'true' : 'false'}</isActive>`
    );
    xmlLines.push(
      `    <createdAt>${product.createdAt.toISOString()}</createdAt>`
    );
    xmlLines.push(
      `    <updatedAt>${product.updatedAt.toISOString()}</updatedAt>`
    );
    xmlLines.push(`    <url>${escapeXmlValue(productUrl)}</url>`);
    xmlLines.push('    <images>');
    for (const imageUrl of images) {
      xmlLines.push(`      <image>${escapeXmlValue(imageUrl)}</image>`);
    }
    xmlLines.push('    </images>');
    xmlLines.push('  </product>');
  }

  xmlLines.push('</products>');

  fs.writeFileSync(outputPath, xmlLines.join('\n'), 'utf-8');
}

/**
 * Main export function
 */
export async function exportProducts(
  options: ExportOptions
): Promise<ExportResult> {
  const { format, onlyNew, lastExportDate, outputPath, sharedTimestamp } =
    options;

  // Build query conditions
  const where: any = {
    isActive: true,
    AND: [
      {
        OR: [
          { batchProcessingStatus: 'completed' },
          { source: 'MANUAL' },
          { source: 'AG' },
        ],
      },
    ],
  };

  // If only exporting new products, filter by date
  if (onlyNew && lastExportDate) {
    where.AND.push({
      OR: [
        { createdAt: { gte: lastExportDate } },
        { updatedAt: { gte: lastExportDate } },
      ],
    });
  }

  // Fetch products with related data
  const products = await prisma.product.findMany({
    where,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          path: true,
        },
      },
      images: {
        where: {
          isActive: true,
        },
        orderBy: [{ isPrimary: 'desc' }, { sort: 'asc' }],
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Debug: Log products with images count
  const productsWithImages = products.filter(
    p => p.images && p.images.length > 0
  );
  console.log(
    `📦 Export: ${products.length} products total, ${productsWithImages.length} with images`
  );
  if (products.length > 0 && productsWithImages.length === 0) {
    console.warn('⚠️ Warning: No products have images!');
  }

  // Determine output path with timestamp including time
  // Use shared timestamp if provided (for grouping CSV and XML from same run)
  let dateStr: string;
  let timeStr: string;

  if (sharedTimestamp) {
    // Parse shared timestamp (format: YYYY-MM-DD-HH-MM-SS)
    const parts = sharedTimestamp.split('-');
    dateStr = parts.slice(0, 3).join('-');
    timeStr = parts.slice(3).join('-');
  } else {
    const now = new Date();
    dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    timeStr = now.toISOString().split('T')[1].split('.')[0].replace(/:/g, '-'); // HH-MM-SS
  }

  const extension = format === 'csv' ? 'csv' : 'xml';
  const filename = `products-export-${dateStr}-${timeStr}.${extension}`;
  const finalOutputPath =
    outputPath || path.join(process.cwd(), 'exports', filename);

  // Ensure exports directory exists
  const exportsDir = path.dirname(finalOutputPath);
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }

  // Export based on format
  if (format === 'csv') {
    await exportToCsv(products, finalOutputPath);
  } else {
    await exportToXml(products, finalOutputPath);
  }

  const result: ExportResult = {
    filePath: finalOutputPath,
    productCount: products.length,
    format,
    exportedAt: new Date(),
  };

  // Save metadata with product count
  const metadataPath = finalOutputPath.replace(/\.(csv|xml)$/, '.meta.json');
  const metadata = {
    productCount: products.length,
    format: format,
    exportedAt: result.exportedAt.toISOString(),
    filename: path.basename(finalOutputPath),
  };
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

  // Upload to S3 if requested (default: true)
  const shouldUpload = options.uploadToS3 !== false;
  if (shouldUpload) {
    try {
      const fileContent = fs.readFileSync(finalOutputPath);
      // Use the same filename for S3 key
      const s3Key = `exports/${filename}`;
      const contentType =
        format === 'csv'
          ? 'text/csv; charset=utf-8'
          : 'application/xml; charset=utf-8';

      console.log(
        `📤 Uploading to S3: ${s3Key} (${format}, ${fileContent.length} bytes)`
      );
      const uploadResult = await putBuffer(s3Key, fileContent, contentType);

      if (uploadResult.success && uploadResult.url) {
        result.s3Key = s3Key;
        result.s3Url = uploadResult.url;
        console.log(`✅ File uploaded to S3: ${uploadResult.url}`);
        console.log(`   S3 Key: ${s3Key}`);
        console.log(`   Format: ${format}`);
        console.log(`   Size: ${fileContent.length} bytes`);

        // Also upload metadata file to S3
        try {
          const metadataS3Key = s3Key.replace(/\.(csv|xml)$/, '.meta.json');
          const metadataContent = JSON.stringify(metadata, null, 2);
          const metadataUploadResult = await putBuffer(
            metadataS3Key,
            Buffer.from(metadataContent, 'utf-8'),
            'application/json'
          );
          if (metadataUploadResult.success) {
            console.log(`✅ Metadata uploaded to S3: ${metadataS3Key}`);
          }
        } catch (metadataError) {
          console.warn('⚠️ Failed to upload metadata to S3:', metadataError);
          // Don't fail the export if metadata upload fails
        }
      } else {
        console.warn(`⚠️ Failed to upload to S3: ${uploadResult.error}`);
        console.warn(`   S3 Key: ${s3Key}`);
      }
    } catch (error) {
      console.error('Error uploading to S3:', error);
      // Don't fail the export if S3 upload fails
    }
  }

  return result;
}

/**
 * Get last export date from file
 */
export function getLastExportDate(): Date | null {
  const lastExportFile = path.join(process.cwd(), 'exports', '.last-export');
  if (fs.existsSync(lastExportFile)) {
    const content = fs.readFileSync(lastExportFile, 'utf-8').trim();
    if (content) {
      return new Date(content);
    }
  }
  return null;
}

/**
 * Save last export date to file
 */
export function saveLastExportDate(date: Date): void {
  const exportsDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }
  const lastExportFile = path.join(exportsDir, '.last-export');
  fs.writeFileSync(lastExportFile, date.toISOString(), 'utf-8');
}

export interface ExportStatus {
  status: 'idle' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  progress?: {
    current: number;
    total: number;
    message?: string;
  };
  error?: string;
  result?: {
    csv?: ExportResult;
    xml?: ExportResult;
  };
}

/**
 * Get current export status
 * Always reads fresh from disk (no caching)
 */
export function getExportStatus(): ExportStatus {
  const statusFile = path.join(process.cwd(), 'exports', '.export-status');
  if (fs.existsSync(statusFile)) {
    try {
      // Read file with explicit encoding and no caching
      const content = fs.readFileSync(statusFile, {
        encoding: 'utf-8',
        flag: 'r',
      });
      const parsed = JSON.parse(content);
      return parsed;
    } catch (error) {
      console.error('Error reading export status file:', error);
      return { status: 'idle' };
    }
  }
  return { status: 'idle' };
}

/**
 * Save export status to file
 */
export function saveExportStatus(status: ExportStatus): void {
  const exportsDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }
  const statusFile = path.join(exportsDir, '.export-status');
  // Use writeFileSync with explicit flush to ensure file is written immediately
  fs.writeFileSync(statusFile, JSON.stringify(status, null, 2), 'utf-8');
  // Force sync to disk (if available)
  try {
    const fd = fs.openSync(statusFile, 'r+');
    fs.fsyncSync(fd);
    fs.closeSync(fd);
  } catch {
    // Ignore fsync errors (not critical)
  }
}

/**
 * Check if export is currently running
 */
export function isExportRunning(): boolean {
  const status = getExportStatus();
  if (status.status === 'running') {
    // Check if it's not stuck (more than 30 minutes)
    if (status.startedAt) {
      const startedAt = new Date(status.startedAt);
      const now = new Date();
      const diffMinutes = (now.getTime() - startedAt.getTime()) / (1000 * 60);
      if (diffMinutes > 30) {
        // Consider it stuck, reset to idle
        saveExportStatus({ status: 'idle' });
        return false;
      }
    }
    return true;
  }
  return false;
}
