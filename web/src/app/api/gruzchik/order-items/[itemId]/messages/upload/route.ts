import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { getSession } from '@/lib/server/session';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'GRUZCHIK') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId } = await params;

    // Verify the order item exists and belongs to this грузчик
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: itemId,
        order: {
          gruzchikId: session.userId,
        },
      },
    });

    if (!orderItem) {
      return NextResponse.json(
        { error: 'Order item not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const text = formData.get('text') as string;
    const isService = formData.get('isService') === 'true';

    // Get all files (support both single 'file' and multiple 'files')
    const files: File[] = [];

    // Check for single file
    const singleFile = formData.get('file') as File;
    if (singleFile && singleFile.name) {
      files.push(singleFile);
    }

    // Check for multiple files
    const multipleFiles = formData.getAll('files') as File[];
    if (multipleFiles.length > 0) {
      files.push(...multipleFiles.filter(file => file && file.name));
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Validate file types and sizes
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}` },
          { status: 400 }
        );
      }
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File too large: ${file.name}` },
          { status: 400 }
        );
      }
    }

    // Process all files and create attachments
    const attachments = await Promise.all(
      files.map(async file => {
        // For now, we'll store the file as base64 in the database
        // In production, you'd want to upload to a cloud storage service like AWS S3
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;

        return {
          type: file.type,
          name: file.name,
          size: file.size,
          data: dataUrl,
        };
      })
    );

    // Create message with attachment
    const newMessage = await prisma.orderItemMessage.create({
      data: {
        orderItemId: itemId,
        userId: session.userId,
        text: text || null,
        isService: isService || false,
        attachments: attachments,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    // Transform message to match frontend format
    const transformedMessage = {
      id: newMessage.id,
      text: newMessage.text,
      sender: newMessage.user.role === 'GRUZCHIK' ? 'gruzchik' : 'client',
      senderName: newMessage.user.name || newMessage.user.phone,
      senderId: newMessage.user.id,
      timestamp: newMessage.createdAt.toISOString(),
      isService: newMessage.isService,
      attachments: newMessage.attachments,
    };

    return NextResponse.json({
      success: true,
      message: transformedMessage,
    });
  } catch (error) {
    console.error('Failed to upload file:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
