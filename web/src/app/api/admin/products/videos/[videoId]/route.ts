import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const auth = await requireAuth(req, 'ADMIN');
    if (auth.error) {
      return auth.error;
    }

    const { videoId } = await params;
    const body = await req.json();

    // Verify video exists
    const video = await prisma.productVideo.findUnique({
      where: { id: videoId },
      select: { id: true, productId: true },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Update video
    const updated = await prisma.productVideo.update({
      where: { id: videoId },
      data: {
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.alt !== undefined && { alt: body.alt }),
        ...(body.sort !== undefined && { sort: body.sort }),
      },
    });

    return NextResponse.json({ video: updated }, { status: 200 });
  } catch (error) {
    console.error('Error updating product video:', error);
    return NextResponse.json(
      { error: 'Failed to update video' },
      { status: 500 }
    );
  }
}
