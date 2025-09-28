import { NextRequest, NextResponse } from 'next/server';

import { env } from '@/lib/env';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const limit = searchParams.get('limit') || '10';

    let url = `${env.WHAPI_BASE_URL}/messages`;

    // If chatId is provided, get messages from specific chat
    if (chatId) {
      url += `?chat_id=${encodeURIComponent(chatId)}&limit=${limit}`;
    } else {
      // Get recent messages from all chats
      url += `?limit=${limit}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${env.WHAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Whapi API error: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: chatId ? `Messages from chat ${chatId}` : 'Recent messages from all chats',
      chatId,
      limit: parseInt(limit),
      data,
    });
  } catch (error) {
    console.error('Failed to fetch messages from Whapi:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
