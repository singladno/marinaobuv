import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated and is admin
    const auth = await requireAuth(request, 'CLIENT');
    if (auth.error) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get the product with source message IDs
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        sourceMessageIds: true,
        createdAt: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if product has source message IDs stored directly
    if (
      product.sourceMessageIds &&
      Array.isArray(product.sourceMessageIds) &&
      product.sourceMessageIds.length > 0
    ) {
      console.log(
        `Found ${product.sourceMessageIds.length} source message IDs for product ${product.id}`
      );

      // Get all messages by their IDs
      const sourceMessages = await prisma.whatsAppMessage.findMany({
        where: {
          id: { in: product.sourceMessageIds as string[] },
        },
        include: {
          provider: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [
          {
            timestamp: 'asc',
          },
          {
            createdAt: 'asc',
          },
        ],
      });

      // Format the messages for the frontend
      const formattedMessages = sourceMessages.map(message => ({
        id: message.id,
        waMessageId: message.waMessageId,
        from: message.from,
        fromName: message.fromName,
        type: message.type,
        text: message.text,
        timestamp: message.timestamp ? Number(message.timestamp) : null,
        mediaUrl: message.mediaUrl,
        mediaMimeType: message.mediaMimeType,
        mediaWidth: message.mediaWidth,
        mediaHeight: message.mediaHeight,
        createdAt: message.createdAt,
        provider: message.provider,
      }));

      return NextResponse.json({
        success: true,
        messages: formattedMessages,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
        },
      });
    }

    // No source message IDs found
    return NextResponse.json({
      success: true,
      messages: [],
      message: 'No source messages found for this product',
    });
  } catch (error) {
    console.error('Failed to fetch source messages:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
