import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';

export async function POST(request: NextRequest) {
  try {
    const { chatId, message } = await request.json();

    if (!chatId || !message) {
      return NextResponse.json({
        success: false,
        error: 'chatId and message are required',
      }, { status: 400 });
    }

    // Try to send a message using Whapi API
    const response = await fetch(`${env.WHAPI_BASE_URL}/messages/text`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.WHAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: chatId,
        body: message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Whapi API error: ${data.message || response.statusText}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Test message sent successfully',
      data,
    });
  } catch (error) {
    console.error('Failed to send test message:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
