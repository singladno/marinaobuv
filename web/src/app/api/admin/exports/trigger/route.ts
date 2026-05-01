import path from 'node:path';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import {
  exportRangeToDates,
  parseExportRangePreset,
} from '@/lib/export-range-presets';
import { logRequestError } from '@/lib/server/request-logging';
import {
  exportProducts,
  getLastExportDate,
  saveExportStatus,
  isExportRunning,
  MAX_PRODUCT_EXPORT_ITEM_LIMIT,
  type ExportStatus as ExportStatusType,
} from '@/lib/services/product-export-service';
import { queueOldPortalXmlImportBackgroundSafe } from '@/lib/services/old-portal-xml-import-service';

// Helper function to check if user has export access
function hasExportAccess(role: string): boolean {
  return role === 'ADMIN' || role === 'EXPORT_MANAGER';
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasExportAccess(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if export is already running
    if (isExportRunning()) {
      return NextResponse.json(
        {
          error: 'Export already in progress',
          message: 'Экспорт уже выполняется. Пожалуйста, подождите завершения.',
        },
        { status: 409 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const onlyNew = body.onlyNew === true;
    const limitRaw = body.limit;
    let limit: number | undefined;
    if (limitRaw !== undefined && limitRaw !== null) {
      const n = Number(limitRaw);
      if (n === 0) {
        // treat as no cap
      } else if (
        !Number.isInteger(n) ||
        n < 1 ||
        n > MAX_PRODUCT_EXPORT_ITEM_LIMIT
      ) {
        return NextResponse.json(
          {
            error: 'Invalid limit',
            message: `Параметр limit: 0 без лимита, иначе от 1 до ${MAX_PRODUCT_EXPORT_ITEM_LIMIT.toLocaleString('ru-RU')}`,
          },
          { status: 400 }
        );
      } else {
        limit = n;
      }
    }
    const preset = parseExportRangePreset(body.range ?? 'all');
    if (preset === null) {
      return NextResponse.json(
        {
          error: 'Invalid range',
          message: 'Допустимые значения range: all, 1d, 3d, 7d, 30d',
        },
        { status: 400 }
      );
    }

    const resolvedRange = exportRangeToDates(preset);
    const dateFrom = resolvedRange?.dateFrom;
    const dateTo = resolvedRange?.dateTo;

    const useOnlyNew = !dateFrom || !dateTo ? onlyNew : false;
    const lastExportDate = useOnlyNew ? getLastExportDate() : null;

    // Set status to running
    const startStatus: ExportStatusType = {
      status: 'running',
      startedAt: new Date().toISOString(),
      progress: {
        current: 0,
        total: 2,
        message: 'Начало экспорта...',
      },
    };
    saveExportStatus(startStatus);

    try {
      // Generate shared timestamp for both CSV and XML to ensure they group together
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeStr = now
        .toISOString()
        .split('T')[1]
        .split('.')[0]
        .replace(/:/g, '-'); // HH-MM-SS
      const sharedTimestamp = `${dateStr}-${timeStr}`;

      // Export CSV
      saveExportStatus({
        ...startStatus,
        progress: {
          current: 1,
          total: 2,
          message: 'Экспорт CSV...',
        },
      });

      const csvResult = await exportProducts({
        format: 'csv',
        onlyNew: useOnlyNew,
        lastExportDate: lastExportDate || undefined,
        dateFrom,
        dateTo,
        sharedTimestamp,
        limit,
      });

      // Export XML
      saveExportStatus({
        ...startStatus,
        progress: {
          current: 2,
          total: 2,
          message: 'Экспорт XML...',
        },
      });

      const xmlResult = await exportProducts({
        format: 'xml',
        onlyNew: useOnlyNew,
        lastExportDate: lastExportDate || undefined,
        dateFrom,
        dateTo,
        sharedTimestamp,
        limit,
      });

      // Cron watermark (`saveLastExportDate`) is only updated by product-export-cron — manual runs must not affect incremental cron exports.

      // Set status to completed
      const completedStatus: ExportStatusType = {
        status: 'completed',
        startedAt: startStatus.startedAt,
        completedAt: new Date().toISOString(),
        result: {
          csv: csvResult,
          xml: xmlResult,
        },
      };
      saveExportStatus(completedStatus);

      if (xmlResult.s3Url) {
        queueOldPortalXmlImportBackgroundSafe({
          xmlFilename: path.basename(xmlResult.filePath),
          s3Url: xmlResult.s3Url,
          triggeredBy: `export-trigger:${session.user?.id ?? 'session'}`,
        });
      }

      return NextResponse.json({
        success: true,
        exports: [
          {
            format: 'csv',
            productCount: csvResult.productCount,
            filePath: csvResult.filePath,
            s3Url: csvResult.s3Url,
            exportedAt: csvResult.exportedAt.toISOString(),
          },
          {
            format: 'xml',
            productCount: xmlResult.productCount,
            filePath: xmlResult.filePath,
            s3Url: xmlResult.s3Url,
            exportedAt: xmlResult.exportedAt.toISOString(),
          },
        ],
        message: `Экспорт завершен: ${csvResult.productCount} товаров`,
      });
    } catch (error) {
      // Set status to failed
      const failedStatus: ExportStatusType = {
        status: 'failed',
        startedAt: startStatus.startedAt,
        completedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      saveExportStatus(failedStatus);

      throw error;
    }
  } catch (error) {
    logRequestError(
      request,
      '/api/admin/exports/trigger',
      error,
      'Error triggering export:'
    );
    return NextResponse.json(
      {
        error: 'Failed to trigger export',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
