import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const limit = searchParams.get('limit') || '10';

    // Try different API formats
    const apiFormats = [
      `${env.WHAPI_BASE_URL}/messages?chat_id=${chatId}&limit=${limit}`,
      `${env.WHAPI_BASE_URL}/messages?chatId=${chatId}&limit=${limit}`,
      `${env.WHAPI_BASE_URL}/messages?chat=${chatId}&limit=${limit}`,
      `${env.WHAPI_BASE_URL}/messages?jid=${chatId}&limit=${limit}`,
      `${env.WHAPI_BASE_URL}/messages?remoteJid=${chatId}&limit=${limit}`,
    ];

    const results = [];

    for (const url of apiFormats) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${env.WHAPI_TOKEN}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        results.push({
          url,
          status: response.status,
          ok: response.ok,
          data: response.ok ? data : null,
          error: !response.ok ? data : null,
        });

        if (response.ok) {
          return NextResponse.json({
            success: true,
            message: `Messages fetched successfully using: ${url}`,
            chatId,
            limit: parseInt(limit),
            data,
          });
        }
      } catch (error) {
        results.push({
          url,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: false,
      message: 'All API format attempts failed',
      chatId,
      limit: parseInt(limit),
      attempts: results,
    });
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
