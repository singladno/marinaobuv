import { NextRequest, NextResponse } from 'next/server';
import { addressGeocodingService } from '@/lib/services/address-geocoding-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Требуется параметр запроса' },
        { status: 400 }
      );
    }

    if (query.trim().length < 3) {
      return NextResponse.json(
        { success: true, suggestions: [] },
        { status: 200 }
      );
    }

    const suggestions =
      await addressGeocodingService.getAddressSuggestions(query);

    console.log(`Address suggestions for "${query}":`, suggestions.length, 'results');

    return NextResponse.json({ success: true, suggestions }, { status: 200 });
  } catch (error) {
    console.error('Address suggestions API error:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Внутренняя ошибка сервера',
      },
      { status: 500 }
    );
  }
}
