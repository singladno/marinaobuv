import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';
import { logRequestError } from '@/lib/server/request-logging';
import {
  getAttachmentBinary,
  listAttachmentMeta,
} from '@/lib/server/order-item-message-attachments';

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ itemId: string; messageId: string; index: string }>;
  }
) {
  try {
    const auth = await requireAuth(request, 'ADMIN');
    if (auth.error) {
      return auth.error;
    }

    const { itemId, messageId, index: indexParam } = await params;
    const index = Number.parseInt(indexParam, 10);
    if (!Number.isInteger(index) || index < 0) {
      return NextResponse.json({ error: 'Invalid index' }, { status: 400 });
    }

    const message = await prisma.orderItemMessage.findFirst({
      where: { id: messageId, orderItemId: itemId },
      select: { attachments: true },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const binary = getAttachmentBinary(message.attachments, index);
    if (binary) {
      return new NextResponse(new Uint8Array(binary.bytes), {
        headers: {
          'Content-Type': binary.contentType,
          'Cache-Control': 'private, max-age=86400',
        },
      });
    }

    const meta = listAttachmentMeta(message.attachments)[index];
    if (meta?.httpUrl) {
      return NextResponse.redirect(meta.httpUrl);
    }

    return NextResponse.json(
      { error: 'Attachment not found' },
      { status: 404 }
    );
  } catch (error) {
    logRequestError(
      request,
      '/api/admin/order-items/[itemId]/messages/[messageId]/attachments/[index]',
      error,
      'Failed to fetch message attachment:'
    );
    return NextResponse.json(
      { error: 'Failed to fetch attachment' },
      { status: 500 }
    );
  }
}
