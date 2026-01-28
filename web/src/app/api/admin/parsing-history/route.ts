import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const parserId = searchParams.get('parserId');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    // Filter by parser type using reason field
    if (parserId) {
      if (parserId === 'wa') {
        where.reason = { contains: 'Groq' };
      } else if (parserId === 'tg') {
        where.reason = { contains: 'Telegram' };
      }
    }

    // Get parsing history with pagination
    const [parsingHistory, totalCount] = await Promise.all([
      prisma.parsingHistory.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.parsingHistory.count({ where }),
    ]);

    // Get current running parsers count
    const runningParsers = await prisma.parsingHistory.count({
      where: { status: 'running' },
    });

    // Get statistics
    const stats = await prisma.parsingHistory.aggregate({
      where: { status: 'completed' },
      _sum: {
        messagesRead: true,
        productsCreated: true,
      },
      _avg: {
        duration: true,
      },
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      parsingHistory,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      stats: {
        runningParsers,
        totalMessagesRead: stats._sum.messagesRead || 0,
        totalProductsCreated: stats._sum.productsCreated || 0,
        averageDuration: Math.round(stats._avg.duration || 0),
      },
    });
  } catch (error) {
    console.error('Error fetching parsing history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parsing history' },
      { status: 500 }
    );
  }
}
