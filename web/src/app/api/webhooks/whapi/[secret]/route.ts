import { NextRequest, NextResponse } from 'next/server';

import { env } from '@/lib/env';
import { processWebhookPayload } from '@/lib/services/webhook-processor-service';
import { WebhookPayloadSchema } from '@/types/whapi';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  try {
    const { secret } = await params;

    // Verify webhook secret
    if (secret !== env.WHAPI_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    // Handle verification/ping
    if (body.event === 'ping' || body.event === 'PING') {
      const verifyToken = body.verify_token || body.verifyToken;
      if (env.WHAPI_VERIFY_TOKEN && verifyToken === env.WHAPI_VERIFY_TOKEN) {
        return NextResponse.json({ ok: true, message: 'Verified' });
      }
    }

    // Validate payload structure
    const parseResult = WebhookPayloadSchema.safeParse(body);
    if (!parseResult.success) {
      console.error('Invalid webhook payload:', parseResult.error);
      return NextResponse.json(
        { ok: false, error: 'Invalid payload' },
        { status: 400 }
      );
    }

    const payload = parseResult.data;

    // Process the webhook payload
    const result = await processWebhookPayload(payload);

    return NextResponse.json({
      ok: true,
      processed: result.processed,
      message: result.message,
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
