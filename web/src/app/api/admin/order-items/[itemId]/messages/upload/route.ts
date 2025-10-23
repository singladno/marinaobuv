import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const auth = await requireAuth(request, 'ADMIN');
    if (auth.error) {
      return auth.error;
    }

    const { itemId } = await params;

    // Verify the order item exists
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: itemId,
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
          { error: `File type ${file.type} not allowed` },
          { status: 400 }
        );
      }
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File ${file.name} is too large. Maximum size is 10MB` },
          { status: 400 }
        );
      }
    }

    // Process files and create attachments
    const attachments = [];
    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;

      attachments.push({
        type: file.type,
        name: file.name,
        size: file.size,
        data: dataUrl,
      });
    }

    // Create message in database
    const newMessage = await prisma.orderItemMessage.create({
      data: {
        orderItemId: itemId,
        userId: auth.user.id,
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
      sender:
        newMessage.user.role === 'GRUZCHIK'
          ? 'gruzchik'
          : newMessage.user.role === 'ADMIN'
            ? 'admin'
            : 'client',
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
    console.error('Failed to upload message with files:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
