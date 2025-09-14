import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

export async function GET() {
  try {
    // Fetch chats from Whapi API
    const response = await fetch(`${env.WHAPI_BASE_URL}/chats`, {
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
      message: 'Recent chats fetched from WhatsApp',
      data,
    });
  } catch (error) {
    console.error('Failed to fetch chats from Whapi:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
