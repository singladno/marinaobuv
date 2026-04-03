import fs from 'fs';
import path from 'path';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import { getRequestLogger } from '@/lib/server/request-logging';

const prisma = new PrismaClient();

function readProductionBuildId(): string | null {
  try {
    const p = path.join(process.cwd(), '.next', 'BUILD_ID');
    return fs.readFileSync(p, 'utf8').trim();
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const log = getRequestLogger(request);
  const buildId = readProductionBuildId();
  try {
    // Test database connectivity
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: 'ok',
        time: new Date().toISOString(),
        service: 'web',
        database: 'connected',
        /** Next.js production bundle id (from `next build`). Null if `.next` missing — app is mis-deployed. */
        buildId,
        /** PM2 blue/green marker from ecosystem-blue-green.config.js */
        deployment: process.env.DEPLOYMENT_COLOR ?? null,
        productionBundlePresent: buildId !== null,
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
        buildId,
        deployment: process.env.DEPLOYMENT_COLOR ?? null,
        productionBundlePresent: buildId !== null,
        error:
          error instanceof Error ? error.message : 'Unknown database error',
      },
      { status: 503 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
