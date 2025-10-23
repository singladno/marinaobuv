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
    const { feedbackType } = await request.json();

    if (
      !feedbackType ||
      !['WRONG_SIZE', 'WRONG_ITEM', 'AGREE_REPLACEMENT'].includes(feedbackType)
    ) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      );
    }

    // Verify the order item belongs to this client
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: itemId,
        order: {
          userId: auth.user.id,
        },
      },
    });

    if (!orderItem) {
      return NextResponse.json(
        { error: 'Order item not found' },
        { status: 404 }
      );
    }

    // Check if feedback already exists for this item and user
    const existingFeedback = await prisma.orderItemFeedback.findFirst({
      where: {
        orderItemId: itemId,
        userId: auth.user.id,
        feedbackType: feedbackType,
      },
    });

    if (existingFeedback) {
      return NextResponse.json(
        { error: 'Feedback already exists for this type' },
        { status: 409 }
      );
    }

    // Create feedback
    const feedback = await prisma.orderItemFeedback.create({
      data: {
        orderItemId: itemId,
        userId: auth.user.id,
        feedbackType: feedbackType,
      },
      include: {
        user: {
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
      feedback: {
        id: feedback.id,
        type: feedback.feedbackType,
        createdAt: feedback.createdAt.toISOString(),
        user: feedback.user,
      },
    });
  } catch (error) {
    console.error('Failed to create feedback:', error);
    return NextResponse.json(
      { error: 'Failed to create feedback' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const auth = await requireAuth(request, 'CLIENT');
    if (auth.error) {
      return auth.error;
    }

    const { itemId } = await params;

    // Verify the order item belongs to this client
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: itemId,
        order: {
          userId: auth.user.id,
        },
      },
    });

    if (!orderItem) {
      return NextResponse.json(
        { error: 'Order item not found' },
        { status: 404 }
      );
    }

    // Get all feedback for this item
    const feedbacks = await prisma.orderItemFeedback.findMany({
      where: {
        orderItemId: itemId,
      },
      include: {
        user: {
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
      feedbacks: feedbacks.map(feedback => ({
        id: feedback.id,
        type: feedback.feedbackType,
        createdAt: feedback.createdAt.toISOString(),
        user: feedback.user,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}
