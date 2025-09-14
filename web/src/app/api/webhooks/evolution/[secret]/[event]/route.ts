import { NextRequest, NextResponse } from 'next/server';

import { env } from '@/lib/env';
import { processWebhookPayload } from '@/lib/message-processor';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string; event: string }> }
) {
  try {
    // Await params
    const { secret } = await params;

    // Check webhook secret
    if (secret !== env.EVOLUTION_WEBHOOK_SECRET) {
      console.log('Invalid webhook secret');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      console.log('Rate limit exceeded for IP:', ip);
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    // Process the webhook payload
    const result = await processWebhookPayload(request);

    if (result.success) {
      return NextResponse.json({ ok: true });
    } else {
      return NextResponse.json(
        { error: result.error || 'Processing failed' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
