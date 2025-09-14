import { NextRequest, NextResponse } from 'next/server';

import { env } from '@/lib/env';
import { setInstanceWebhook } from '@/lib/evo';

export async function GET(request: NextRequest) {
  try {
    // Only allow in development or with explicit authorization
    if (env.NODE_ENV === 'production') {
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${env.EVOLUTION_WEBHOOK_SECRET}`) {
        return NextResponse.json(
          { error: 'Unauthorized - use Authorization header in production' },
          { status: 401 }
        );
      }
    }

    // Build webhook URL
    const baseUrl = env.NEXT_PUBLIC_SITE_URL;
    const webhookUrl = `${baseUrl}/api/webhooks/evolution/${env.EVOLUTION_WEBHOOK_SECRET}`;

    console.log('Setting up Evolution webhook:', {
      instance: env.EVOLUTION_INSTANCE,
      webhookUrl,
    });

    // Set webhook for the instance
    const result = await setInstanceWebhook(webhookUrl, [
      'MESSAGES_UPSERT',
      'MESSAGES_UPDATE',
      'MESSAGES_DELETE'
    ]);

    if (result.success) {
      console.log('Webhook setup successful:', result.data);
      return NextResponse.json({
        success: true,
        message: 'Webhook configured successfully',
        webhookUrl,
        instance: env.EVOLUTION_INSTANCE,
        data: result.data,
      });
    } else {
      console.error('Webhook setup failed:', result.message);
      return NextResponse.json(
        {
          success: false,
          error: result.message || 'Failed to configure webhook',
          webhookUrl,
          instance: env.EVOLUTION_INSTANCE,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Webhook setup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Allow POST for programmatic setup
  return GET(request);
}
