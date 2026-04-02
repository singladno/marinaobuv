import { NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { logger } from '@/lib/server/logger';

export async function POST() {
  try {
    logger.info('cleanup_stuck_parsing_start');

    // Find parsing processes that have been running for more than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const stuckRecords = await prisma.parsingHistory.findMany({
      where: {
        status: 'running',
        startedAt: { lt: oneHourAgo },
      },
      orderBy: { startedAt: 'desc' },
    });

    if (stuckRecords.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No stuck parsing processes found',
        cleanedCount: 0,
      });
    }

    logger.info(
      { count: stuckRecords.length },
      'cleanup_stuck_parsing_found'
    );

    // Clean up stuck processes
    for (const record of stuckRecords) {
      const now = new Date();
      const duration = Math.floor(
        (now.getTime() - record.startedAt.getTime()) / 1000
      );

      await prisma.parsingHistory.upsert({
        where: { id: record.id },
        update: {
          status: 'failed',
          completedAt: now,
          errorMessage:
            'Process timeout - marked as failed due to stuck status',
          duration: duration,
        },
        create: {
          id: record.id,
          status: 'failed',
          completedAt: now,
          errorMessage:
            'Process timeout - marked as failed due to stuck status',
          duration: duration,
        },
      });
    }

    logger.info(
      { cleanedCount: stuckRecords.length },
      'cleanup_stuck_parsing_done'
    );

    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up ${stuckRecords.length} stuck parsing processes`,
      cleanedCount: stuckRecords.length,
    });
  } catch (error) {
    logger.error(
      { err: error, route: '/api/admin/cleanup-stuck-parsing' },
      'Error during cleanup'
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cleanup stuck parsing processes',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
