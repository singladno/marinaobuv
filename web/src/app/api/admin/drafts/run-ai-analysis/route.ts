import { NextRequest, NextResponse } from 'next/server';

import { getCategoryTree } from '@/lib/catalog';
import { prisma } from '@/lib/db-node';
import {
  analyzeDraft,
  markDraftsAsProcessing,
  type AnalysisResult,
} from '@/lib/second-analysis-helpers';
import { broadcastAIEvent } from '@/app/api/ai-events/route';

export async function POST(request: NextRequest) {
  try {
    const { draftIds } = await request.json();

    if (!draftIds || !Array.isArray(draftIds) || draftIds.length === 0) {
      return NextResponse.json(
        { error: 'Draft IDs are required' },
        { status: 400 }
      );
    }

    const drafts = await getApprovedDrafts(draftIds);
    if (drafts.length === 0) {
      return NextResponse.json(
        { error: 'No approved drafts found' },
        { status: 404 }
      );
    }

    const categoryTreeJson = await getCategoryTreeJson();
    await markDraftsAsProcessing(draftIds);

    // Broadcast AI start event
    broadcastAIEvent({
      type: 'ai_start',
      totalDrafts: drafts.length,
      timestamp: Date.now(),
    });

    const results = await processDrafts(drafts, categoryTreeJson, draftIds);

    // Broadcast AI complete event
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    broadcastAIEvent({
      type: 'ai_complete',
      success: true,
      totalProcessed: successCount,
      totalFailed: failedCount,
      timestamp: Date.now(),
    });

    return NextResponse.json({
      success: true,
      results,
      message: `Analyzed ${successCount} out of ${drafts.length} drafts`,
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to run AI analysis' },
      { status: 500 }
    );
  }
}

async function getApprovedDrafts(draftIds: string[]) {
  return await prisma.waDraftProduct.findMany({
    where: {
      id: { in: draftIds },
      status: 'approved',
    },
    include: {
      images: {
        where: { isActive: true },
        orderBy: { sort: 'asc' },
      },
    },
  });
}

async function getCategoryTreeJson(): Promise<string> {
  const categoryTree = await getCategoryTree();
  return JSON.stringify(categoryTree);
}

async function processDrafts(
  drafts: Array<{
    id: string;
    images: Array<{ url: string; id: string; sort: number }>;
  }>,
  categoryTreeJson: string,
  draftIds: string[]
): Promise<AnalysisResult[]> {
  const results: AnalysisResult[] = [];

  for (let i = 0; i < drafts.length; i++) {
    const draft = drafts[i];

    // Broadcast progress event
    broadcastAIEvent({
      type: 'ai_progress',
      draftId: draft.id,
      currentDraft: i + 1,
      totalDrafts: drafts.length,
      draftName: draft.id, // You might want to get the actual name from the draft
      status: 'processing',
      timestamp: Date.now(),
    });

    const result = await analyzeDraft(draft, categoryTreeJson);
    results.push(result);

    // Add a small delay between requests to avoid overwhelming the API
    if (i < drafts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}
