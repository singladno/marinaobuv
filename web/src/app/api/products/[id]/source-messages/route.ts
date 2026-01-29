import { NextRequest, NextResponse } from 'next/server';
import { ProductSource } from '@prisma/client';

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
        source: true,
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
        `Found ${product.sourceMessageIds.length} source message IDs for product ${product.id} (source: ${product.source})`
      );

      // Fetch messages based on product source
      if (product.source === ProductSource.TG) {
        // Get Telegram messages
        const sourceMessages = await prisma.telegramMessage.findMany({
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
          orderBy: {
            createdAt: 'asc',
          },
        });

        // Get product images (S3 URLs) to match with photo messages
        const productImages = await prisma.productImage.findMany({
          where: {
            productId: product.id,
            isActive: true,
          },
          orderBy: {
            sort: 'asc',
          },
        });

        // Filter photo messages and match them with product images by order
        const photoMessages = sourceMessages.filter(
          (msg: any) => msg.type === 'photo'
        );
        let imageIndex = 0;

        // Format the messages for the frontend
        const formattedMessages = sourceMessages.map((message: any) => {
          // For photo messages, use S3 URL from ProductImage if available
          let mediaUrl = message.mediaUrl;
          if (message.type === 'photo' && imageIndex < productImages.length) {
            mediaUrl = productImages[imageIndex].url;
            imageIndex++;
          }

          return {
            id: message.id,
            tgMessageId: message.tgMessageId
              ? message.tgMessageId.toString()
              : null,
            from:
              message.fromUsername ||
              (message.fromId ? message.fromId.toString() : null) ||
              null,
            fromName: message.fromFirstName || message.fromUsername || null,
            type: message.type,
            text: message.text || message.caption,
            timestamp: message.createdAt.getTime(),
            mediaUrl: mediaUrl,
            mediaMimeType: message.mediaMimeType,
            mediaWidth: message.mediaWidth,
            mediaHeight: message.mediaHeight,
            createdAt: message.createdAt,
            provider: message.provider,
          };
        });

        return NextResponse.json({
          success: true,
          messages: formattedMessages,
          product: {
            id: product.id,
            name: product.name,
            slug: product.slug,
          },
        });
      } else {
        // Get WhatsApp messages (default)
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
