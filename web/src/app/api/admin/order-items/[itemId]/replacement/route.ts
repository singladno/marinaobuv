import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSession } from '@/lib/server/session';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    console.log('Replacement API called');
    const session = await getSession();
    console.log('Session:', session);

    if (!session || session.role !== 'ADMIN') {
      console.log('Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId } = await params;
    console.log('Item ID:', itemId);

    const { replacementImageUrl, replacementImageKey, adminComment } =
      await request.json();
    console.log('Request data:', {
      replacementImageUrl,
      replacementImageKey,
      adminComment,
    });

    if (!replacementImageUrl && !replacementImageKey) {
      return NextResponse.json(
        { error: 'Replacement image is required' },
        { status: 400 }
      );
    }

    // Verify the order item exists
    console.log('Looking for order item:', itemId);
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: itemId,
      },
      include: {
        order: {
          select: {
            userId: true,
          },
        },
      },
    });

    console.log('Order item found:', orderItem);

    if (!orderItem) {
      console.log('Order item not found');
      return NextResponse.json(
        { error: 'Order item not found' },
        { status: 404 }
      );
    }

    if (!orderItem.order.userId) {
      console.log('Order has no client');
      return NextResponse.json(
        { error: 'Order has no client' },
        { status: 400 }
      );
    }

    // Check if replacement already exists and is pending
    const existingReplacement = await prisma.orderItemReplacement.findFirst({
      where: {
        orderItemId: itemId,
        status: 'PENDING',
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

    if (existingReplacement) {
      return NextResponse.json(
        {
          error: 'Replacement proposal already exists',
          existingReplacement: {
            id: existingReplacement.id,
            status: existingReplacement.status,
            replacementImageUrl: existingReplacement.replacementImageUrl,
            replacementImageKey: existingReplacement.replacementImageKey,
            adminComment: existingReplacement.adminComment,
            createdAt: existingReplacement.createdAt.toISOString(),
            adminUser: existingReplacement.adminUser,
            clientUser: existingReplacement.clientUser,
          },
        },
        { status: 409 }
      );
    }

    // Create replacement proposal
    console.log('Creating replacement with data:', {
      orderItemId: itemId,
      adminUserId: session.userId,
      clientUserId: orderItem.order.userId,
      replacementImageUrl: replacementImageUrl || null,
      replacementImageKey: replacementImageKey || null,
      adminComment: adminComment || null,
      status: 'PENDING',
    });

    const replacement = await prisma.orderItemReplacement.create({
      data: {
        orderItemId: itemId,
        adminUserId: session.userId,
        clientUserId: orderItem.order.userId,
        replacementImageUrl: replacementImageUrl || null,
        replacementImageKey: replacementImageKey || null,
        adminComment: adminComment || null,
        status: 'PENDING',
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

    console.log('Replacement created successfully:', replacement);

    // Create a chat message about the replacement proposal
    try {
      const messageData: {
        orderItemId: string;
        userId: string;
        text?: string;
        isService: boolean;
        attachments?: any;
      } = {
        orderItemId: itemId,
        userId: session.userId,
        isService: false, // Not a service message
      };

      if (adminComment) {
        messageData.text = adminComment;
      }

      if (replacementImageUrl) {
        messageData.attachments = [
          {
            type: 'image/jpeg',
            name: replacementImageKey || 'replacement_image.jpg',
            url: replacementImageUrl,
          },
        ];
      }

      await prisma.orderItemMessage.create({
        data: messageData,
      });
      console.log('Replacement chat message created');
    } catch (messageError) {
      console.error('Failed to create replacement chat message:', messageError);
      // Don't fail the whole operation if message creation fails
    }

    return NextResponse.json({
      success: true,
      replacement: {
        id: replacement.id,
        status: replacement.status,
        replacementImageUrl: replacement.replacementImageUrl,
        replacementImageKey: replacement.replacementImageKey,
        adminComment: replacement.adminComment,
        createdAt: replacement.createdAt.toISOString(),
        adminUser: replacement.adminUser,
        clientUser: replacement.clientUser,
      },
    });
  } catch (error) {
    console.error('Failed to create replacement:', error);
    return NextResponse.json(
      { error: 'Failed to create replacement' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId } = await params;
    const {
      replacementId,
      replacementImageUrl,
      replacementImageKey,
      adminComment,
    } = await request.json();

    if (!replacementId) {
      return NextResponse.json(
        { error: 'Replacement ID is required' },
        { status: 400 }
      );
    }

    // Verify the replacement exists and belongs to this admin
    const existingReplacement = await prisma.orderItemReplacement.findFirst({
      where: {
        id: replacementId,
        orderItemId: itemId,
        adminUserId: session.userId,
        status: 'PENDING',
      },
    });

    if (!existingReplacement) {
      return NextResponse.json(
        { error: 'Replacement not found or not editable' },
        { status: 404 }
      );
    }

    // Update the replacement
    const updatedReplacement = await prisma.orderItemReplacement.update({
      where: {
        id: replacementId,
      },
      data: {
        replacementImageUrl: replacementImageUrl || null,
        replacementImageKey: replacementImageKey || null,
        adminComment: adminComment || null,
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

    return NextResponse.json({
      success: true,
      replacement: {
        id: updatedReplacement.id,
        status: updatedReplacement.status,
        replacementImageUrl: updatedReplacement.replacementImageUrl,
        replacementImageKey: updatedReplacement.replacementImageKey,
        adminComment: updatedReplacement.adminComment,
        createdAt: updatedReplacement.createdAt.toISOString(),
        adminUser: updatedReplacement.adminUser,
        clientUser: updatedReplacement.clientUser,
      },
    });
  } catch (error) {
    console.error('Failed to update replacement:', error);
    return NextResponse.json(
      { error: 'Failed to update replacement' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId } = await params;
    const { replacementId } = await request.json();

    if (!replacementId) {
      return NextResponse.json(
        { error: 'Replacement ID is required' },
        { status: 400 }
      );
    }

    // Verify the replacement exists and belongs to this admin
    const existingReplacement = await prisma.orderItemReplacement.findFirst({
      where: {
        id: replacementId,
        orderItemId: itemId,
        adminUserId: session.userId,
        status: 'PENDING',
      },
    });

    if (!existingReplacement) {
      return NextResponse.json(
        { error: 'Replacement not found or not deletable' },
        { status: 404 }
      );
    }

    // Delete the replacement
    await prisma.orderItemReplacement.delete({
      where: {
        id: replacementId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Replacement deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete replacement:', error);
    return NextResponse.json(
      { error: 'Failed to delete replacement' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Get all replacements for this item
    const replacements = await prisma.orderItemReplacement.findMany({
      where: {
        orderItemId: itemId,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      replacements: replacements.map(replacement => ({
        id: replacement.id,
        status: replacement.status,
        replacementImageUrl: replacement.replacementImageUrl,
        replacementImageKey: replacement.replacementImageKey,
        adminComment: replacement.adminComment,
        clientComment: replacement.clientComment,
        createdAt: replacement.createdAt.toISOString(),
        adminUser: replacement.adminUser,
        clientUser: replacement.clientUser,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch replacements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch replacements' },
      { status: 500 }
    );
  }
}
