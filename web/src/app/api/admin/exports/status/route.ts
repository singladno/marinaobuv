import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import {
  getLastExportDate,
  getExportStatus,
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

    // Get last export date
    const lastExportDate = getLastExportDate();

    // Get current export status
    const exportStatus = getExportStatus();

    // Calculate next scheduled export (daily at 02:00)
    const now = new Date();
    const nextExport = new Date();
    nextExport.setHours(2, 0, 0, 0);

    // If it's already past 02:00 today, schedule for tomorrow
    if (now.getHours() >= 2) {
      nextExport.setDate(nextExport.getDate() + 1);
    }

    // Check if cron is enabled (check environment variable)
    const cronEnabled = process.env.DISABLE_CRON_PRODUCT_EXPORT !== 'true';

    const response = NextResponse.json({
      success: true,
      lastExportDate: lastExportDate?.toISOString() || null,
      nextScheduledExport: nextExport.toISOString(),
      cronEnabled,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      currentExport: exportStatus,
    });

    // Prevent caching to ensure fresh data on each request
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Error getting export status:', error);
    return NextResponse.json(
      {
        error: 'Failed to get export status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
