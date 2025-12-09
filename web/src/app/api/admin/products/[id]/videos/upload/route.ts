import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';
import { getObjectKey, getPublicUrl, uploadImage } from '@/lib/storage';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req, 'ADMIN');
    if (auth.error) {
      return auth.error;
    }

    const { id } = await params;
    const formData = await req.formData();

    const file = formData.get('file') as File;
    const alt = formData.get('alt') as string | null;
    const sort = parseInt(formData.get('sort') as string) || 0;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only video files are allowed.' },
        { status: 400 }
      );
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get file extension
    const ext = file.name.split('.').pop() || 'mp4';
    const contentType = file.type || 'video/mp4';

    // Generate object key for video
    const timestamp = Date.now();
    const rand = Math.random().toString(36).slice(2);
    const key = `products/${id}/videos/${timestamp}-${rand}.${ext}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to storage (using the same uploadImage function which is generic)
    await uploadImage(key, buffer, contentType);

    // Get public URL
    const publicUrl = getPublicUrl(key);

    // Create product video record
    const created = await prisma.productVideo.create({
      data: {
        productId: id,
        url: publicUrl,
        key,
        alt: alt || `Product video ${sort + 1}`,
        sort,
      },
    });

    return NextResponse.json({ video: created }, { status: 201 });
  } catch (error) {
    console.error('Error uploading product video:', error);
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    );
  }
}
