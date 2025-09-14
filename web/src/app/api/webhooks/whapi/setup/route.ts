import { NextRequest, NextResponse } from 'next/server';
import { setWebhook } from '@/lib/whapi';
import { env } from '@/lib/env';

export async function GET(request: NextRequest) {
  try {
    // Build webhook URL
    const webhookUrl = `${env.NEXT_PUBLIC_SITE_URL}/api/webhooks/whapi/${env.WHAPI_WEBHOOK_SECRET}`;

    console.log(`Setting up webhook: ${webhookUrl}`);

    // Set webhook with Whapi.cloud
    const result = await setWebhook(webhookUrl, [
      'messages.upsert',
      'messages.update',
      'messages.delete'
    ]);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Webhook configured successfully',
        webhookUrl,
        data: result.data,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message || 'Failed to configure webhook',
        webhookUrl,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Webhook setup error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Handle other HTTP methods
export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
