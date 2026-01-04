import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import {
  exportProducts,
  saveLastExportDate,
  getLastExportDate,
  getExportStatus,
  saveExportStatus,
  isExportRunning,
  type ExportStatus as ExportStatusType,
} from '@/lib/services/product-export-service';

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

    // Get last export date if onlyNew is true
    const lastExportDate = onlyNew ? getLastExportDate() : null;

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
        onlyNew,
        lastExportDate: lastExportDate || undefined,
        sharedTimestamp,
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
        onlyNew,
        lastExportDate: lastExportDate || undefined,
        sharedTimestamp,
      });

      // Save last export date
      saveLastExportDate(new Date());

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
    console.error('Error triggering export:', error);
    return NextResponse.json(
      {
        error: 'Failed to trigger export',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
