import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import fs from 'fs';
import path from 'path';

import { authOptions } from '@/lib/auth';
import {
  exportRangeToDates,
  parseExportRangePreset,
} from '@/lib/export-range-presets';
import { logRequestError } from '@/lib/server/request-logging';
import {
  exportProducts,
  getLastExportDate,
  parseExportDayEnd,
  parseExportDayStart,
  saveLastExportDate,
  type ExportOptions,
} from '@/lib/services/product-export-service';

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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const format = (searchParams.get('format') || 'csv') as 'csv' | 'xml';
    const onlyNew = searchParams.get('onlyNew') === 'true';
    const download = searchParams.get('download') !== 'false'; // Default to true
    const rangeRaw = searchParams.get('range');
    const dateFromParam = searchParams.get('dateFrom');
    const dateToParam = searchParams.get('dateTo');

    let dateFrom: Date | undefined;
    let dateTo: Date | undefined;

    if (rangeRaw !== null) {
      const preset = parseExportRangePreset(rangeRaw);
      if (preset === null) {
        return NextResponse.json(
          {
            error: 'Invalid range',
            message:
              'Допустимые значения range: all, 1d, 3d, 7d, 30d',
          },
          { status: 400 }
        );
      }
      const resolved = exportRangeToDates(preset);
      if (resolved) {
        dateFrom = resolved.dateFrom;
        dateTo = resolved.dateTo;
      }
    } else if (dateFromParam ?? dateToParam) {
      if (!dateFromParam || !dateToParam) {
        return NextResponse.json(
          {
            error: 'Invalid date range',
            message:
              'Укажите оба параметра dateFrom и dateTo (формат YYYY-MM-DD)',
          },
          { status: 400 }
        );
      }
      const from = parseExportDayStart(dateFromParam);
      const to = parseExportDayEnd(dateToParam);
      if (!from || !to) {
        return NextResponse.json(
          {
            error: 'Invalid date range',
            message: 'Некорректные dateFrom или dateTo (ожидается YYYY-MM-DD)',
          },
          { status: 400 }
        );
      }
      dateFrom = from;
      dateTo = to;
    }

    // Build export options
    const options: ExportOptions = {
      format,
      onlyNew: dateFrom && dateTo ? false : onlyNew,
    };

    if (dateFrom && dateTo) {
      options.dateFrom = dateFrom;
      options.dateTo = dateTo;
    } else if (onlyNew) {
      const lastExportDate = getLastExportDate();
      if (lastExportDate) {
        options.lastExportDate = lastExportDate;
      }
    }

    // Perform export
    const result = await exportProducts(options);

    // Save last export date
    saveLastExportDate(result.exportedAt);

    // If download is requested, return file
    if (download) {
      const fileContent = fs.readFileSync(result.filePath);
      const contentType =
        format === 'csv'
          ? 'text/csv; charset=utf-8'
          : 'application/xml; charset=utf-8';

      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set(
        'Content-Disposition',
        `attachment; filename="${path.basename(result.filePath)}"`
      );
      headers.set('Cache-Control', 'no-store');

      return new NextResponse(fileContent, { headers });
    }

    // Otherwise return metadata
    return NextResponse.json({
      success: true,
      filePath: result.filePath,
      productCount: result.productCount,
      format: result.format,
      exportedAt: result.exportedAt,
    });
  } catch (error) {
    logRequestError(
      request,
      '/api/admin/products/export',
      error,
      'Error exporting products:'
    );
    return NextResponse.json(
      {
        error: 'Failed to export products',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
