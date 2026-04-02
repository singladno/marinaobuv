import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/server/auth';
import { splitDraft } from '@/lib/services/draft-split-service';
import { logRequestError } from '@/lib/server/request-logging';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, 'ADMIN');
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { draftId, imageIds } = await request.json();

    if (
      !draftId ||
      !imageIds ||
      !Array.isArray(imageIds) ||
      imageIds.length === 0
    ) {
      return NextResponse.json(
        { error: 'Draft ID and image IDs are required' },
        { status: 400 }
      );
    }

    const result = await splitDraft({ draftId, imageIds });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logRequestError(request, '/api/admin/drafts/split', error, 'Error splitting draft:');

    if (error instanceof Error) {
      if (error.message === 'Draft not found') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === 'Some image IDs are invalid') {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
