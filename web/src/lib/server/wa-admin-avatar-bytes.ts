import { prisma } from '@/lib/db-node';
import { tryCreateGreenApiAdminFetcher } from '@/lib/green-api-fetcher';
import { isValidAdminWaChatId } from '@/lib/server/wa-chat-id';

export const isValidWaChatId = isValidAdminWaChatId;

/** Parse Green API `base64Avatar` (data URL or raw base64) into image bytes. */
export function waAvatarBytesFromGreenBase64Field(
  base64Field: string | undefined
): { bytes: Uint8Array; contentType: string } | null {
  if (!base64Field?.trim()) return null;
  const t = base64Field.trim();
  if (t.startsWith('data:')) {
    const comma = t.indexOf(',');
    if (comma < 0) return null;
    const header = t.slice(5, comma);
    const b64 = t.slice(comma + 1).replace(/\s/g, '');
    if (!header.includes('base64')) return null;
    const semi = header.indexOf(';');
    const contentType = semi >= 0 ? header.slice(0, semi) : 'image/jpeg';
    try {
      const buf = Buffer.from(b64, 'base64');
      if (buf.length === 0 || buf.length > 512_000) return null;
      return { bytes: new Uint8Array(buf), contentType };
    } catch {
      return null;
    }
  }
  try {
    const buf = Buffer.from(t, 'base64');
    if (buf.length === 0 || buf.length > 512_000) return null;
    return { bytes: new Uint8Array(buf), contentType: 'image/jpeg' };
  } catch {
    return null;
  }
}

async function fetchRemoteAvatarBytes(
  url: string
): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'User-Agent':
          'Mozilla/5.0 (compatible; MarinaObuvAvatar/1.0; +https://www.marina-obuv.ru)',
      },
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) return null;
    const contentType =
      res.headers.get('content-type')?.split(';')[0]?.trim() || 'image/jpeg';
    if (!contentType.startsWith('image/')) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength === 0) return null;
    return { bytes: buf, contentType };
  } catch {
    return null;
  }
}

type ResolveResult =
  | {
      ok: true;
      url: string;
      /** Present when Green API returned base64 — skip CDN fetch. */
      inlineAvatar?: { bytes: Uint8Array; contentType: string };
    }
  | { ok: false };

/**
 * Resolve avatar URL / inline bytes from Green API only.
 * Avatars are not persisted in our Postgres — clients cache in IndexedDB + HTTP cache.
 */
export async function resolveWaAvatarUrl(
  chatId: string
): Promise<ResolveResult> {
  const chat = await prisma.waAdminChat.findUnique({
    where: { chatId },
    select: { chatId: true },
  });
  if (!chat) {
    return { ok: false };
  }

  const api = tryCreateGreenApiAdminFetcher();
  if (!api) {
    return { ok: false };
  }

  try {
    const { urlAvatar, available, base64Avatar } = await api.getAvatar(chatId);
    const url = urlAvatar && available ? urlAvatar : null;
    const inline = waAvatarBytesFromGreenBase64Field(base64Avatar);
    if (url) {
      return {
        ok: true,
        url,
        ...(inline ? { inlineAvatar: inline } : {}),
      };
    }
    if (inline) {
      return { ok: true, url: '', inlineAvatar: inline };
    }
  } catch {
    /* fall through */
  }

  return { ok: false };
}

/** CDN bytes; on failure refresh from Green API once and retry. */
export async function fetchWaAvatarBytesWithRetry(chatId: string): Promise<{
  bytes: Uint8Array;
  contentType: string;
} | null> {
  const resolved = await resolveWaAvatarUrl(chatId);
  if (!resolved.ok) {
    return null;
  }

  if (resolved.inlineAvatar) {
    return resolved.inlineAvatar;
  }

  if (!resolved.url) {
    return null;
  }

  let remote = await fetchRemoteAvatarBytes(resolved.url);
  if (remote) {
    return remote;
  }

  const api = tryCreateGreenApiAdminFetcher();
  if (!api) {
    return null;
  }

  try {
    const { urlAvatar, available, base64Avatar } = await api.getAvatar(chatId);
    const inline = waAvatarBytesFromGreenBase64Field(base64Avatar);
    if (inline) {
      return inline;
    }
    const url = urlAvatar && available ? urlAvatar : null;
    if (!url) {
      return null;
    }
    remote = await fetchRemoteAvatarBytes(url);
    return remote;
  } catch {
    return null;
  }
}
