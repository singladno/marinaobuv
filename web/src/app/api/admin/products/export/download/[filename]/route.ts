import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import fs from 'fs';
import path from 'path';

import { authOptions } from '@/lib/auth';
import { publicUrl } from '@/lib/s3u';

// Helper function to check if user has export access
function hasExportAccess(role: string): boolean {
  return role === 'ADMIN' || role === 'EXPORT_MANAGER';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasExportAccess(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filename } = await params;

    // Validate filename to prevent path traversal
    if (!filename.match(/^products-export-\d{4}-\d{2}-\d{2}\.(csv|xml)$/)) {
      return NextResponse.json(
        { error: 'Invalid filename format' },
        { status: 400 }
      );
    }

    // Try to get file from local storage first
    const exportsDir = path.join(process.cwd(), 'exports');
    const filePath = path.join(exportsDir, filename);

    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath);
      const contentType =
        filename.endsWith('.csv')
          ? 'text/csv; charset=utf-8'
          : 'application/xml; charset=utf-8';

      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set(
        'Content-Disposition',
        `attachment; filename="${filename}"`
      );
      headers.set('Cache-Control', 'no-store');

      return new NextResponse(fileContent, { headers });
    }

    // If file not found locally, redirect to S3 URL
    const s3Key = `exports/${filename}`;
    const s3Url = publicUrl(s3Key);

    return NextResponse.json({
      error: 'File not found locally',
      s3Url,
      message: 'File is available in S3 storage',
    });
  } catch (error) {
    console.error('Error downloading export:', error);
    return NextResponse.json(
      {
        error: 'Failed to download export',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
