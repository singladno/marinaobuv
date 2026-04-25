import { prisma } from '@/lib/server/db';
import { putBuffer } from '@/lib/s3u';
import fs from 'fs';
import path from 'path';
import { logger, logServerError } from '@/lib/server/logger';

export interface ExportOptions {
  format: 'csv' | 'xml';
  onlyNew?: boolean; // Only export products created/updated since last export
  lastExportDate?: Date;
  /** If set, onlyNew / lastExportDate are ignored (calendar UTC days or rolling window from API) */
  dateFrom?: Date;
  dateTo?: Date;
  outputPath?: string; // Optional file path to save export
  uploadToS3?: boolean; // Upload to S3 after creating file (default: true)
  sharedTimestamp?: string; // Shared timestamp for grouping CSV and XML from same export run
  /** If set, at most this many products (newest first). */
  limit?: number;
}

/** Upper bound for optional export row limit (API should validate too). */
export const MAX_PRODUCT_EXPORT_ITEM_LIMIT = 100_000;

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Parse YYYY-MM-DD as start of that calendar day (UTC). */
export function parseExportDayStart(isoDate: string): Date | null {
  const s = isoDate.trim();
  if (!ISO_DAY.test(s)) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Parse YYYY-MM-DD as end of that calendar day (UTC). */
export function parseExportDayEnd(isoDate: string): Date | null {
  const s = isoDate.trim();
  if (!ISO_DAY.test(s)) return null;
  const d = new Date(`${s}T23:59:59.999Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export interface ExportResult {
  filePath: string; // Local file path
  s3Key?: string; // S3 key if uploaded
  s3Url?: string; // Public S3 URL if uploaded
  productCount: number;
  format: 'csv' | 'xml';
  exportedAt: Date;
}

type SizeRow = { size: string; count: number };

function compareSizeKey(a: string, b: string): number {
  return a.localeCompare(b, 'ru', { numeric: true });
}

function mergeSizeRows(rows: SizeRow[]): SizeRow[] {
  const map = new Map<string, number>();
  for (const { size, count } of rows) {
    if (!size) continue;
    const c = count > 0 ? Math.floor(count) : 0;
    if (c <= 0) continue;
    map.set(size, (map.get(size) ?? 0) + c);
  }
  return Array.from(map.entries()).map(([size, count]) => ({ size, count }));
}

function normalizeSizeRows(value: unknown): SizeRow[] {
  if (value === null || value === undefined) return [];
  try {
    if (Array.isArray(value)) {
      if (value.length === 0) return [];
      if (
        value.every(
          item => typeof item === 'object' && item && 'size' in (item as object)
        )
      ) {
        return mergeSizeRows(
          (value as Array<{ size: string; count?: number }>).map(r => {
            const raw = r.count;
            const c =
              raw === null || raw === undefined
                ? 1
                : Math.max(0, Math.floor(Number(raw)));
            return { size: String(r.size).trim(), count: c };
          })
        );
      }
      if (
        value.every(
          item => typeof item === 'string' || typeof item === 'number'
        )
      ) {
        return mergeSizeRows(
          (value as Array<string | number>).map(v => ({
            size: String(v).trim(),
            count: 1,
          }))
        );
      }
      return [];
    }
    if (typeof value === 'object') {
      const out: SizeRow[] = [];
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        const size = k.trim();
        if (!size) continue;
        if (v === true) out.push({ size, count: 1 });
        else if (v === 1) out.push({ size, count: 1 });
        else if (typeof v === 'number' && v > 0) {
          out.push({ size, count: Math.floor(v) });
        }
      }
      return mergeSizeRows(out);
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const s = String(value).trim();
      return s ? mergeSizeRows([{ size: s, count: 1 }]) : [];
    }
  } catch {
    // fall through
  }
  return [];
}

/** "6 пар" / "1 пара" / "2 штуки" — form after a numeral. */
function quantityUnitWord(
  n: number,
  unit: 'PAIRS' | 'PIECES'
): string {
  const m = n % 100;
  if (m >= 11 && m <= 14) {
    return unit === 'PIECES' ? 'штук' : 'пар';
  }
  const d = n % 10;
  if (d === 1) return unit === 'PIECES' ? 'штука' : 'пара';
  if (d >= 2 && d <= 4) return unit === 'PIECES' ? 'штуки' : 'пары';
  return unit === 'PIECES' ? 'штук' : 'пар';
}

function escapeHtmlText(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Formats sizes for the legacy import portal: summary line + HTML table
 * (e.g. "36-40 6 пар (38 по 2)" and &lt;table border="1"&gt;...).
 */
function formatSizesLegacyPortal(
  value: unknown,
  measurementUnit: 'PAIRS' | 'PIECES' = 'PAIRS'
): string {
  const rows = normalizeSizeRows(value);
  if (rows.length === 0) return '';

  const sorted = [...rows].sort((a, b) => compareSizeKey(a.size, b.size));
  const total = sorted.reduce((s, r) => s + r.count, 0);
  if (total <= 0) return '';

  const minS = sorted[0]!.size;
  const maxS = sorted[sorted.length - 1]!.size;
  const rangePart = minS === maxS ? minS : `${minS}-${maxS}`;

  const moreThanOne = sorted.filter(r => r.count > 1);
  const paren =
    moreThanOne.length > 0
      ? ` (${moreThanOne.map(r => `${r.size} по ${r.count}`).join(', ')})`
      : '';

  const u = quantityUnitWord(total, measurementUnit);
  const firstLine = `${rangePart} ${total} ${u}${paren}`;

  const sizeTds = sorted
    .map(r => `    <td>${escapeHtmlText(r.size)}</td>`)
    .join('\n');
  const countTds = sorted
    .map(r => `    <td>${escapeHtmlText(String(r.count))}</td>`)
    .join('\n');
  const table = `<table border="1">
<tr>
${sizeTds}
</tr>
<tr>
${countTds}
</tr>
</table>
<br>`;

  return `${firstLine}\n${table}`;
}

/** Safe CDATA: escape embedded `]]>`. */
function cdata(s: string): string {
  if (!s) return '';
  if (!s.includes(']]>')) return s;
  return s.split(']]>').join(']]]]><![CDATA[>');
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
    'sectionid',
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

    const sectionId =
      (product.category as { legacySectionId?: string | null })
        ?.legacySectionId ?? '';

    return [
      product.id,
      product.name,
      product.article || '',
      categoryPath,
      sectionId,
      Number(product.pricePair),
      product.currency || 'RUB',
      product.material || '',
      product.gender || '',
      product.season || '',
      product.description || '',
      formatSizesLegacyPortal(
        product.sizes,
        (product.measurementUnit as 'PAIRS' | 'PIECES') ?? 'PAIRS'
      ),
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
    const sectionId =
      (product.category as { legacySectionId?: string | null })
        ?.legacySectionId ?? '';
    xmlLines.push(`    <sectionid>${escapeXmlValue(sectionId)}</sectionid>`);
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
    const sizesText = formatSizesLegacyPortal(
      product.sizes,
      (product.measurementUnit as 'PAIRS' | 'PIECES') ?? 'PAIRS'
    );
    if (sizesText) {
      xmlLines.push(`    <sizes><![CDATA[${cdata(sizesText)}]]></sizes>`);
    } else {
      xmlLines.push('    <sizes></sizes>');
    }
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
  const {
    format,
    onlyNew,
    lastExportDate,
    outputPath,
    sharedTimestamp,
    dateFrom,
    dateTo,
    limit: limitOption,
  } = options;

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

  const hasRange =
    dateFrom instanceof Date &&
    dateTo instanceof Date &&
    !Number.isNaN(dateFrom.getTime()) &&
    !Number.isNaN(dateTo.getTime());

  if (hasRange) {
    if (dateFrom > dateTo) {
      throw new Error('dateFrom must be on or before dateTo');
    }
    // Include if created in [from, to] OR updated in [from, to] (inclusive UTC days)
    where.AND.push({
      OR: [
        { createdAt: { gte: dateFrom, lte: dateTo } },
        { updatedAt: { gte: dateFrom, lte: dateTo } },
      ],
    });
  } else if (onlyNew && lastExportDate) {
    where.AND.push({
      OR: [
        { createdAt: { gte: lastExportDate } },
        { updatedAt: { gte: lastExportDate } },
      ],
    });
  }

  let take: number | undefined;
  if (limitOption !== undefined && limitOption !== null) {
    const n = Math.floor(Number(limitOption));
    if (Number.isFinite(n) && n > 0) {
      take = Math.min(n, MAX_PRODUCT_EXPORT_ITEM_LIMIT);
    }
  }

  // Fetch products with related data.
  // Use select (not include) to exclude gptRequest/gptResponse — they can be huge
  // and cause "Failed to convert rust String into napi string" in Prisma.
  const products = await prisma.product.findMany({
    where,
    take,
    select: {
      id: true,
      slug: true,
      name: true,
      article: true,
      pricePair: true,
      currency: true,
      material: true,
      gender: true,
      season: true,
      description: true,
      sizes: true,
      measurementUnit: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      category: {
        select: {
          id: true,
          name: true,
          path: true,
          legacySectionId: true,
        },
      },
      images: {
        where: { isActive: true },
        orderBy: [{ isPrimary: 'desc' }, { sort: 'asc' }],
        select: { id: true, url: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Debug: Log products with images count
  const productsWithImages = products.filter(
    p => p.images && p.images.length > 0
  );
  logger.debug(
    `📦 Export: ${products.length} products total, ${productsWithImages.length} with images`
  );
  if (products.length > 0 && productsWithImages.length === 0) {
    logger.warn('⚠️ Warning: No products have images!');
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

      logger.debug(
        `📤 Uploading to S3: ${s3Key} (${format}, ${fileContent.length} bytes)`
      );
      const uploadResult = await putBuffer(s3Key, fileContent, contentType);

      if (uploadResult.success && uploadResult.url) {
        result.s3Key = s3Key;
        result.s3Url = uploadResult.url;
        logger.debug(`✅ File uploaded to S3: ${uploadResult.url}`);
        logger.debug(`   S3 Key: ${s3Key}`);
        logger.debug(`   Format: ${format}`);
        logger.debug(`   Size: ${fileContent.length} bytes`);

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
            logger.debug(`✅ Metadata uploaded to S3: ${metadataS3Key}`);
          }
        } catch (metadataError) {
          logger.warn(
            { err: metadataError },
            'Failed to upload metadata to S3'
          );
          // Don't fail the export if metadata upload fails
        }
      } else {
        logger.warn(`⚠️ Failed to upload to S3: ${uploadResult.error}`);
        logger.warn(`   S3 Key: ${s3Key}`);
      }
    } catch (error) {
      logServerError('Error uploading to S3:', error);
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
      logServerError('Error reading export status file:', error);
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
