import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db-node';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Get drafts with AI processing status
    const drafts = await prisma.waDraftProduct.findMany({
      where: {
        status: status || 'approved',
        aiStatus: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        aiStatus: true,
        aiProcessedAt: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Count processing items
    const processingCount = drafts.filter(
      d => d.aiStatus === 'ai_processing'
    ).length;
    const completedCount = drafts.filter(
      d => d.aiStatus === 'ai_completed'
    ).length;
    const failedCount = drafts.filter(d => d.aiStatus === 'ai_failed').length;

    return NextResponse.json({
      success: true,
      data: {
        drafts,
        counts: {
          processing: processingCount,
          completed: completedCount,
          failed: failedCount,
          total: drafts.length,
        },
      },
    });
  } catch (error) {
    console.error('AI status error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI status' },
      { status: 500 }
    );
  }
}
