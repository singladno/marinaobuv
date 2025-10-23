import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    // Get search history for the user (if logged in) or return empty array
    let searchHistory: Array<{ id: string; query: string; createdAt: Date }> =
      [];

    if (auth.user?.id) {
      const rows = await prisma.searchHistory.findMany({
        where: {
          userId: auth.user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          query: true,
          createdAt: true,
        },
      });

      // Deduplicate by query (case-insensitive), keeping the most recent
      const seen = new Set<string>();
      const deduped: typeof rows = [];
      for (const row of rows) {
        const key = row.query.trim().toLowerCase();
        if (key && !seen.has(key)) {
          seen.add(key);
          deduped.push(row);
        }
        if (deduped.length >= 10) break; // limit to 10 unique queries
      }
      searchHistory = deduped;
    }
    return NextResponse.json({ searchHistory });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch search history' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    if (auth.error) {
      return auth.error;
    }

    const { searchParams } = new URL(request.url);
    const searchId = searchParams.get('id');

    if (searchId) {
      // Delete specific search history item
      await prisma.searchHistory.delete({
        where: {
          id: searchId,
          userId: auth.user.id, // Ensure user can only delete their own searches
        },
      });
    } else {
      // Delete all search history for the user
      await prisma.searchHistory.deleteMany({
        where: {
          userId: auth.user.id,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete search history' },
      { status: 500 }
    );
  }
}
