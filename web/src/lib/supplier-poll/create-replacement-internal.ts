import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/server/db';

/**
 * Same core logic as POST /api/admin/order-items/[itemId]/replacement (without HTTP).
 */
export async function createReplacementProposalInternal(params: {
  orderItemId: string;
  adminUserId: string;
  replacementImageUrl: string | null;
  replacementImageKey: string | null;
  adminComment: string | null;
}): Promise<{ id: string }> {
  const orderItem = await prisma.orderItem.findFirst({
    where: { id: params.orderItemId },
    include: {
      order: { select: { userId: true } },
    },
  });

  if (!orderItem) {
    throw new Error('ORDER_ITEM_NOT_FOUND');
  }

  if (!orderItem.order.userId) {
    throw new Error('ORDER_HAS_NO_CLIENT');
  }

  if (!params.replacementImageUrl && !params.replacementImageKey) {
    throw new Error('REPLACEMENT_IMAGE_REQUIRED');
  }

  const existing = await prisma.orderItemReplacement.findFirst({
    where: {
      orderItemId: params.orderItemId,
      status: 'PENDING',
    },
  });

  if (existing) {
    throw new Error('REPLACEMENT_ALREADY_PENDING');
  }

  const replacement = await prisma.orderItemReplacement.create({
    data: {
      orderItemId: params.orderItemId,
      adminUserId: params.adminUserId,
      clientUserId: orderItem.order.userId,
      replacementImageUrl: params.replacementImageUrl,
      replacementImageKey: params.replacementImageKey,
      adminComment: params.adminComment,
      status: 'PENDING',
    },
  });

  try {
    let attachments: Prisma.InputJsonValue | undefined;
    if (params.replacementImageUrl) {
      attachments = [
        {
          type: 'image/jpeg',
          name: params.replacementImageKey || 'replacement_image.jpg',
          url: params.replacementImageUrl,
        },
      ] as Prisma.InputJsonValue;
    }

    await prisma.orderItemMessage.create({
      data: {
        orderItemId: params.orderItemId,
        userId: params.adminUserId,
        text: params.adminComment ?? null,
        isService: false,
        ...(attachments !== undefined ? { attachments } : {}),
      },
    });
  } catch {
    // non-fatal
  }

  return { id: replacement.id };
}
