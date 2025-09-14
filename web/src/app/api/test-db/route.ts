import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();

    // Test a simple query
    const messageCount = await prisma.whatsAppMessage.count();

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      messageCount,
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
