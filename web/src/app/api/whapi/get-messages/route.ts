import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const limit = searchParams.get('limit') || '10';

    if (!chatId) {
      return NextResponse.json({
        success: false,
        error: 'chatId is required',
      }, { status: 400 });
    }

    // Use the correct API endpoint from the documentation
    const response = await fetch(`${env.WHAPI_BASE_URL}/messages/list/${encodeURIComponent(chatId)}?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${env.WHAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Whapi API error: ${data.message || response.statusText}`);
    }

    return NextResponse.json({
      success: true,
      message: `Messages fetched from chat ${chatId}`,
      chatId,
      limit: parseInt(limit),
      data,
    });
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
