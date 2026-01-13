import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';
import { getObjectKey, getPublicUrl, uploadImage } from '@/lib/storage';
import { normalizeToStandardColor } from '@/lib/constants/colors';

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
    const color = formData.get('color') as string | null;
    const isPrimary = formData.get('isPrimary') === 'true';
    const sort = parseInt(formData.get('sort') as string) || 0;

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

    // Generate object key
    const key = getObjectKey({ productId: id, ext });

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to storage
    await uploadImage(key, buffer, contentType);

    // Get public URL
    const publicUrl = getPublicUrl(key);

    // Normalize color to standard color
    const normalizedColor = color ? normalizeToStandardColor(color) : null;

    // Create product image record
    const created = await prisma.productImage.create({
      data: {
        productId: id,
        url: publicUrl,
        key,
        alt: normalizedColor || `Product image ${sort + 1}`,
        color: normalizedColor,
        sort,
        isPrimary,
      },
    });

    return NextResponse.json({ image: created }, { status: 201 });
  } catch (error) {
    console.error('Error uploading product image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
