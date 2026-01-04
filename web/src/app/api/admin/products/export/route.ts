import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import fs from 'fs';
import path from 'path';

import { authOptions } from '@/lib/auth';
import {
  exportProducts,
  getLastExportDate,
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

    // Build export options
    const options: ExportOptions = {
      format,
      onlyNew,
    };

    if (onlyNew) {
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
    console.error('Error exporting products:', error);
    return NextResponse.json(
      {
        error: 'Failed to export products',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
