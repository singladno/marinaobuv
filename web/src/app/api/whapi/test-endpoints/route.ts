import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

export async function GET() {
  try {
    const endpoints = [
      '/messages',
      '/messages/history',
      '/messages/read',
      '/chats/messages',
      '/chats/120363166212501014@g.us/messages',
      '/chats/79296430333-1565970647@g.us/messages',
      '/chats/120363368785658710@g.us/messages',
    ];

    const results = [];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${env.WHAPI_BASE_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${env.WHAPI_TOKEN}`,
            'Content-Type': 'application/json',
          },
        });

        results.push({
          endpoint,
          status: response.status,
          ok: response.ok,
          statusText: response.statusText,
        });
      } catch (error) {
        results.push({
          endpoint,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Testing different Whapi endpoints',
      results,
    });
  } catch (error) {
    console.error('Failed to test endpoints:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
