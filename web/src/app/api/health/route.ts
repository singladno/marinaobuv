import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
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
    console.error('Database health check failed:', error);

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
