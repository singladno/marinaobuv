import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/server/auth-helpers';
import { getStandardColors, normalizeToStandardColor } from '@/lib/constants/colors';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, 'ADMIN');
    if (auth.error) {
      return auth.error;
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    // Get all standard colors
    const standardColors = getStandardColors();

    // Filter by query if provided
    const filteredColors = query
      ? standardColors.filter(color =>
          color.toLowerCase().includes(query.toLowerCase())
        )
      : standardColors;

    return NextResponse.json({ colors: filteredColors });
  } catch (error) {
    console.error('Error fetching colors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch colors' },
      { status: 500 }
    );
  }
}
