import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSession } from '@/lib/server/session';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId } = await params;
    const { replacementImageUrl, replacementImageKey, adminComment } =
      await request.json();

    if (!replacementImageUrl && !replacementImageKey) {
      return NextResponse.json(
        { error: 'Replacement image is required' },
        { status: 400 }
      );
    }

    // Verify the order item exists
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

    if (!orderItem) {
      return NextResponse.json(
        { error: 'Order item not found' },
        { status: 404 }
      );
    }

    if (!orderItem.order.userId) {
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
    });

    if (existingReplacement) {
      return NextResponse.json(
        { error: 'Replacement proposal already exists' },
        { status: 409 }
      );
    }

    // Create replacement proposal
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
