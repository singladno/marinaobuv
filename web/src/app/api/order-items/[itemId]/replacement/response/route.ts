import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const auth = await requireAuth(request, 'CLIENT');
    if (auth.error) {
      return auth.error;
    }

    const { itemId } = await params;
    const { replacementId, status } = await request.json();

    if (
      !replacementId ||
      !status ||
      !['ACCEPTED', 'REJECTED'].includes(status)
    ) {
      return NextResponse.json(
        { error: 'Invalid replacement response data' },
        { status: 400 }
      );
    }

    // Verify the replacement exists and belongs to this client
    const replacement = await prisma.orderItemReplacement.findFirst({
      where: {
        id: replacementId,
        orderItemId: itemId,
        clientUserId: auth.user.id,
        status: 'PENDING',
      },
    });

    if (!replacement) {
      return NextResponse.json(
        { error: 'Replacement not found or already responded' },
        { status: 404 }
      );
    }

    // Update the replacement status
    const updatedReplacement = await prisma.orderItemReplacement.update({
      where: {
        id: replacementId,
      },
      data: {
        status: status as 'ACCEPTED' | 'REJECTED',
        clientComment:
          status === 'ACCEPTED'
            ? 'Клиент принял предложение о замене'
            : 'Клиент отказался от замены',
      },
      include: {
        adminUser: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        clientUser: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    // Create a chat message about the response
    try {
      await prisma.orderItemMessage.create({
        data: {
          orderItemId: itemId,
          userId: auth.user.id,
          text:
            status === 'ACCEPTED'
              ? 'Клиент принял предложение о замене'
              : 'Клиент отказался от замены',
          isService: true,
        },
      });
    } catch (messageError) {
      console.error('Failed to create response chat message:', messageError);
      // Don't fail the whole operation if message creation fails
    }

    return NextResponse.json({
      success: true,
      replacement: {
        id: updatedReplacement.id,
        status: updatedReplacement.status,
        replacementImageUrl: updatedReplacement.replacementImageUrl,
        replacementImageKey: updatedReplacement.replacementImageKey,
        adminComment: updatedReplacement.adminComment,
        clientComment: updatedReplacement.clientComment,
        createdAt: updatedReplacement.createdAt.toISOString(),
        adminUser: updatedReplacement.adminUser,
        clientUser: updatedReplacement.clientUser,
      },
    });
  } catch (error) {
    console.error('Failed to respond to replacement:', error);
    return NextResponse.json(
      { error: 'Failed to respond to replacement' },
      { status: 500 }
    );
  }
}
