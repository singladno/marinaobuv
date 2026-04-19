import { env } from '@/lib/env';
import { logger } from '@/lib/server/logger';

const RELAY_PATH = '/api/webhooks/green-api/relay';

export function getGreenWebhookPrimaryUrl(): string {
  if (env.GREEN_API_WEBHOOK_PRIMARY_URL) {
    return env.GREEN_API_WEBHOOK_PRIMARY_URL.replace(/\/$/, '');
  }
  const site = env.NEXT_PUBLIC_SITE_URL;
  if (!site) {
    throw new Error(
      'Set GREEN_API_WEBHOOK_PRIMARY_URL or NEXT_PUBLIC_SITE_URL for webhook relay primary target'
    );
  }
  const base = site.replace(/\/$/, '');
  return `${base}/api/webhooks/green-api`;
}

/** Normalize for duplicate / loop detection (origin + pathname without trailing slash). */
export function normalizeWebhookTargetUrl(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const path = u.pathname.replace(/\/$/, '') || '';
    return `${u.origin}${path}`;
  } catch {
    return null;
  }
}

export function isUnsafeSecondaryUrl(
  secondaryUrl: string,
  primaryUrl: string
): boolean {
  const sec = normalizeWebhookTargetUrl(secondaryUrl);
  const pri = normalizeWebhookTargetUrl(primaryUrl);
  if (!sec || !pri) return true;
  if (sec === pri) {
    logger.warn(
      '[WA webhook relay] secondary URL matches primary, skipping forward'
    );
    return true;
  }
  try {
    const u = new URL(secondaryUrl.trim());
    if (u.pathname.includes(RELAY_PATH)) {
      logger.warn(
        '[WA webhook relay] secondary points to relay path, skipping'
      );
      return true;
    }
  } catch {
    return true;
  }
  return false;
}

export async function forwardGreenWebhookPost(params: {
  targetUrl: string;
  body: string;
  sourceHeaders: Headers;
}): Promise<Response> {
  const { targetUrl, body, sourceHeaders } = params;
  const h = new Headers();
  const ct = sourceHeaders.get('content-type');
  if (ct) h.set('Content-Type', ct);
  else h.set('Content-Type', 'application/json');
  const auth = sourceHeaders.get('authorization');
  if (auth) h.set('Authorization', auth);

  // ngrok free: without this, server-side fetch often gets an HTML interstitial instead of the app.
  try {
    const host = new URL(targetUrl).hostname;
    if (
      host.endsWith('.ngrok-free.app') ||
      host.endsWith('.ngrok-free.dev') ||
      host.endsWith('.ngrok.io') ||
      host.endsWith('.ngrok.app') ||
      host.endsWith('.ngrok.dev')
    ) {
      h.set('ngrok-skip-browser-warning', 'true');
    }
  } catch {
    /* ignore */
  }

  return fetch(targetUrl, {
    method: 'POST',
    headers: h,
    body,
    signal: AbortSignal.timeout(45_000),
  });
}
