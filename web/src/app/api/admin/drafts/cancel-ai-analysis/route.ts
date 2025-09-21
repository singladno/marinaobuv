import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db-node';

export async function POST(request: NextRequest) {
  try {
    // Reset all drafts that are currently being processed by AI
    const result = await prisma.waDraftProduct.updateMany({
      where: {
        aiStatus: 'ai_processing',
      },
      data: {
        aiStatus: null,
        aiProcessedAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Cancelled AI analysis for ${result.count} drafts`,
      count: result.count,
    });
  } catch (error) {
    console.error('Cancel AI analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel AI analysis' },
      { status: 500 }
    );
  }
}
