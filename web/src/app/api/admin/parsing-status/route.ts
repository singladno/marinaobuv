import { NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';

export async function GET() {
  try {
    // Get current running parsers
    const runningParsers = await prisma.parsingHistory.findMany({
      where: { status: 'running' },
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        startedAt: true,
        messagesRead: true,
        productsCreated: true,
      },
    });

    // Get latest completed parsing
    const latestCompleted = await prisma.parsingHistory.findFirst({
      where: { status: 'completed' },
      orderBy: { completedAt: 'desc' },
    });

    // Get latest failed parsing
    const latestFailed = await prisma.parsingHistory.findFirst({
      where: { status: 'failed' },
      orderBy: { completedAt: 'desc' },
    });

    // Get statistics for the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const last24HoursStats = await prisma.parsingHistory.aggregate({
      where: {
        startedAt: { gte: twentyFourHoursAgo },
        status: 'completed',
      },
      _sum: {
        messagesRead: true,
        productsCreated: true,
      },
      _count: {
        id: true,
      },
    });

    // Get statistics for the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const last7DaysStats = await prisma.parsingHistory.aggregate({
      where: {
        startedAt: { gte: sevenDaysAgo },
        status: 'completed',
      },
      _sum: {
        messagesRead: true,
        productsCreated: true,
      },
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      runningParsers: runningParsers.length,
      runningParsersDetails: runningParsers,
      latestCompleted,
      latestFailed,
      stats: {
        last24Hours: {
          runs: last24HoursStats._count.id,
          messagesRead: last24HoursStats._sum.messagesRead || 0,
          productsCreated: last24HoursStats._sum.productsCreated || 0,
        },
        last7Days: {
          runs: last7DaysStats._count.id,
          messagesRead: last7DaysStats._sum.messagesRead || 0,
          productsCreated: last7DaysStats._sum.productsCreated || 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching parsing status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parsing status' },
      { status: 500 }
    );
  }
}
