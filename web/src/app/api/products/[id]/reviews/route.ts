import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    // Get reviews with pagination
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [reviews, totalReviews, averageRating] = await Promise.all([
      prisma.review.findMany({
        where: {
          productId,
          isPublished: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
        select: {
          id: true,
          rating: true,
          title: true,
          comment: true,
          name: true,
          isVerified: true,
          createdAt: true,
        },
      }),
      prisma.review.count({
        where: {
          productId,
          isPublished: true,
        },
      }),
      prisma.review.aggregate({
        where: {
          productId,
          isPublished: true,
        },
        _avg: {
          rating: true,
        },
      }),
    ]);

    return NextResponse.json({
      reviews,
      totalReviews,
      averageRating: averageRating._avg.rating || 0,
      page,
      totalPages: Math.ceil(totalReviews / limit),
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const body = await request.json();
    const { rating, title, comment, name, email } = body;

    // Validate required fields
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        productId,
        rating,
        title: title || null,
        comment: comment || null,
        name,
        email,
        isVerified: false, // Could be set to true if user is authenticated
        isPublished: true,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
