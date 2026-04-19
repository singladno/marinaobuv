import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db-node';
import {
  forwardGreenWebhookPost,
  getGreenWebhookPrimaryUrl,
  isUnsafeSecondaryUrl,
} from '@/lib/server/green-webhook-relay';
import { logServerError, logger } from '@/lib/server/logger';

const SINGLETON_ID = 'singleton';

/**
 * Green API → this URL → forwards to primary /api/webhooks/green-api, then optionally to DB-configured dev tunnel.
 * Set Green API dashboard webhook to: https://<host>/api/webhooks/green-api/relay
 */
export async function POST(request: NextRequest) {
  const primaryUrl = getGreenWebhookPrimaryUrl();
  let body: string;
  try {
    body = await request.text();
  } catch (e) {
    logServerError('[WA webhook relay] read body failed:', e);
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  try {
    const primaryRes = await forwardGreenWebhookPost({
      targetUrl: primaryUrl,
      body,
      sourceHeaders: request.headers,
    });

    if (!primaryRes.ok) {
      const errText = await primaryRes.text().catch(() => '');
      logger.error(
        `[WA webhook relay] primary failed ${primaryRes.status} ${errText.slice(0, 500)}`
      );
      return NextResponse.json(
        { error: 'Primary webhook forward failed', status: primaryRes.status },
        { status: primaryRes.status >= 500 ? 502 : primaryRes.status }
      );
    }

    const row = await prisma.greenApiWebhookRelayConfig.findUnique({
      where: { id: SINGLETON_ID },
    });
    const secondaryRaw = row?.secondaryUrl?.trim();

    if (!secondaryRaw) {
      logger.info(
        '[WA webhook relay] secondaryUrl not set in DB (singleton row missing or empty); dev tunnel not notified'
      );
    } else if (isUnsafeSecondaryUrl(secondaryRaw, primaryUrl)) {
      logger.info(
        '[WA webhook relay] secondary URL skipped as unsafe (same as primary or points to relay)'
      );
    } else {
      let secondaryHost = 'unknown';
      try {
        secondaryHost = new URL(secondaryRaw).hostname;
      } catch {
        /* ignore */
      }
      logger.info(
        `[WA webhook relay] forwarding copy to secondary host=${secondaryHost}`
      );
      forwardGreenWebhookPost({
        targetUrl: secondaryRaw,
        body,
        sourceHeaders: request.headers,
      })
        .then(res => {
          if (res.ok) {
            logger.info(
              `[WA webhook relay] secondary ok status=${res.status} host=${secondaryHost}`
            );
          } else {
            logger.warn(
              `[WA webhook relay] secondary ${res.status} ${secondaryRaw.slice(0, 80)}`
            );
          }
        })
        .catch(err => {
          logServerError('[WA webhook relay] secondary forward failed:', err);
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logServerError('[WA webhook relay] error:', error);
    return NextResponse.json(
      { error: 'Webhook relay failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Green API webhook relay is active',
    primaryUrl: getGreenWebhookPrimaryUrl(),
    timestamp: new Date().toISOString(),
  });
}
