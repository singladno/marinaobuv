import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const { imageId } = await params;
    const { isActive } = await request.json();

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean' },
        { status: 400 }
      );
    }

    const updatedImage = await prisma.waDraftProductImage.update({
      where: { id: imageId },
      data: { isActive },
    });

    return NextResponse.json({
      success: true,
      image: updatedImage,
    });
  } catch (error) {
    console.error('Error updating image status:', error);
    return NextResponse.json(
      { error: 'Failed to update image status' },
      { status: 500 }
    );
  }
}
