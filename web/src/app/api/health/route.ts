import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import { getRequestLogger } from '@/lib/server/request-logging';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const log = getRequestLogger(request);
  try {
    // Test database connectivity
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: 'ok',
        time: new Date().toISOString(),
        service: 'web',
        database: 'connected',
      },
      { status: 200 }
    );
  } catch (error) {
    log.error(
      { err: error, route: '/api/health' },
      'database_health_check_failed'
    );

    return NextResponse.json(
      {
        status: 'error',
        time: new Date().toISOString(),
        service: 'web',
        database: 'disconnected',
        error:
          error instanceof Error ? error.message : 'Unknown database error',
      },
      { status: 503 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
