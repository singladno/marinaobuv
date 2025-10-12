import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { getSession } from '@/lib/server/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    // Get search history for the user (if logged in) or return empty array
    let searchHistory: Array<{ id: string; query: string; createdAt: Date }> =
      [];

    if (session?.userId) {
      searchHistory = await prisma.searchHistory.findMany({
        where: {
          userId: session.userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10, // Limit to last 10 searches
        select: {
          id: true,
          query: true,
          createdAt: true,
        },
      });
    }

    return NextResponse.json({ searchHistory });
  } catch (error) {
    console.error('Error fetching search history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search history' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const searchId = searchParams.get('id');

    if (searchId) {
      // Delete specific search history item
      await prisma.searchHistory.delete({
        where: {
          id: searchId,
          userId: session.userId, // Ensure user can only delete their own searches
        },
      });
    } else {
      // Delete all search history for the user
      await prisma.searchHistory.deleteMany({
        where: {
          userId: session.userId,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting search history:', error);
    return NextResponse.json(
      { error: 'Failed to delete search history' },
      { status: 500 }
    );
  }
}
