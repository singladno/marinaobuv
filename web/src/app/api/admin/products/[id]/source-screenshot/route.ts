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

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get file extension
    const ext = file.name.split('.').pop() || 'jpg';
    const contentType = file.type || 'image/jpeg';

    // Generate object key for source screenshot
    const timestamp = Date.now();
    const rand = Math.random().toString(36).slice(2);
    const key = `products/${id}/source-screenshot-${timestamp}-${rand}.${ext}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to storage
    await uploadImage(key, buffer, contentType);

    // Get public URL
    const publicUrl = getPublicUrl(key);

    // Update product with source screenshot
    const updated = await prisma.product.update({
      where: { id },
      data: {
        sourceScreenshotUrl: publicUrl,
        sourceScreenshotKey: key,
      },
    });

    return NextResponse.json({
      product: updated,
      screenshotUrl: publicUrl,
      screenshotKey: key,
    }, { status: 200 });
  } catch (error) {
    console.error('Error uploading source screenshot:', error);
    return NextResponse.json(
      { error: 'Failed to upload source screenshot' },
      { status: 500 }
    );
  }
}
