import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/lib/server/session';
import { splitDraft } from '@/lib/services/draft-split-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    console.error('Error splitting draft:', error);

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
