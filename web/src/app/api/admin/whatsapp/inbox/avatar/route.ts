import { NextRequest, NextResponse } from 'next/server';

import {
  fetchWaAvatarBytesWithRetry,
  isValidWaChatId,
  resolveWaAvatarUrl,
} from '@/lib/server/wa-admin-avatar-bytes';
import { requireAuth } from '@/lib/server/auth-helpers';
import { logServerError } from '@/lib/server/logger';

/** Browser may keep same-origin avatar responses; align with DB TTL. */
const INLINE_CACHE_CONTROL =
  'private, max-age=604800, stale-while-revalidate=86400';

function noAvatarResponse() {
  return new NextResponse(null, {
    status: 404,
    headers: { 'Cache-Control': 'no-store' },
  });
}

/**
 * Lazy avatar:
 * - default / `inline` absent: 302 to CDN (legacy).
 * - `inline=1`: same-origin image bytes — strong HTTP caching + reliable `<img>` disk cache.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, 'ADMIN');
  if (auth.error) return auth.error;

  const chatId = request.nextUrl.searchParams.get('chatId');
  const inline =
    request.nextUrl.searchParams.get('inline') === '1' ||
    request.nextUrl.searchParams.get('inline') === 'true';

  if (!chatId || !isValidWaChatId(chatId)) {
    return NextResponse.json({ error: 'Некорректный chatId' }, { status: 400 });
  }

  try {
    if (inline) {
      const payload = await fetchWaAvatarBytesWithRetry(chatId);
      if (!payload) {
        return noAvatarResponse();
      }
      return new NextResponse(Buffer.from(payload.bytes), {
        status: 200,
        headers: {
          'Content-Type': payload.contentType,
          'Cache-Control': INLINE_CACHE_CONTROL,
        },
      });
    }

    const legacy = await resolveWaAvatarUrl(chatId);
    if (!legacy.ok) {
      return noAvatarResponse();
    }
    return NextResponse.redirect(legacy.url, 302);
  } catch (e) {
    logServerError('[WA avatar] handler error', e);
    return noAvatarResponse();
  }
}
