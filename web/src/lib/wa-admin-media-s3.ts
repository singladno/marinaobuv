import { getExtensionFromMime, putFromUrl } from '@/lib/s3u';
import { logServerError, logger } from '@/lib/server/logger';

/** Не блокировать вебхук бесконечно, если Green downloadUrl «висит». */
const MIRROR_MEDIA_BUDGET_MS = 20_000;

const MEDIA_TYPES_WITH_FILE = new Set([
  'imageMessage',
  'videoMessage',
  'stickerMessage',
  'documentMessage',
  'audioMessage',
  'pttMessage', // voice
  'gifMessage',
]);

export function extractGreenMediaDownload(
  messageData: Record<string, unknown>
): {
  url: string;
  mimeType?: string;
} | null {
  const direct = messageData.downloadUrl;
  if (typeof direct === 'string' && direct.startsWith('http')) {
    return {
      url: direct,
      mimeType:
        typeof messageData.mimeType === 'string'
          ? messageData.mimeType
          : undefined,
    };
  }
  const fileData = messageData.fileMessageData as
    | Record<string, unknown>
    | undefined;
  if (
    fileData &&
    typeof fileData.downloadUrl === 'string' &&
    fileData.downloadUrl.startsWith('http')
  ) {
    return {
      url: fileData.downloadUrl,
      mimeType:
        typeof fileData.mimeType === 'string' ? fileData.mimeType : undefined,
    };
  }
  return null;
}

export function shouldMirrorWebhookMedia(
  typeMessage: string | undefined
): boolean {
  if (!typeMessage) return false;
  return MEDIA_TYPES_WITH_FILE.has(typeMessage);
}

/**
 * If this message type can carry a file and we don't already have CDN URL, download from Green and upload to S3.
 */
export async function mirrorWebhookMediaIfNeeded(params: {
  waMessageId: string;
  typeMessage: string;
  messageData: Record<string, unknown>;
  existingMediaS3Url?: string | null;
}): Promise<string | null> {
  if (params.existingMediaS3Url) return params.existingMediaS3Url;
  if (!shouldMirrorWebhookMedia(params.typeMessage)) return null;
  const dm = extractGreenMediaDownload(params.messageData);
  if (!dm) return null;
  try {
    const r = await Promise.race([
      mirrorWaAdminMediaToS3({
        waMessageId: params.waMessageId,
        downloadUrl: dm.url,
        mimeType: dm.mimeType,
      }),
      new Promise<{ ok: false; error: string }>(resolve =>
        setTimeout(
          () => resolve({ ok: false, error: 'mirror_deadline' }),
          MIRROR_MEDIA_BUDGET_MS
        )
      ),
    ]);
    if (!r.ok) {
      if (r.error === 'mirror_deadline') {
        logger.warn(
          `[wa-admin-media] mirror deadline ${MIRROR_MEDIA_BUDGET_MS}ms waMessageId=${params.waMessageId}`
        );
      }
      return null;
    }
    return r.url;
  } catch (e) {
    logServerError('[wa-admin-media] mirrorWebhookMediaIfNeeded:', e);
    return null;
  }
}

export async function mirrorWaAdminMediaToS3(params: {
  waMessageId: string;
  downloadUrl: string;
  mimeType?: string;
}): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const safeId = params.waMessageId.replace(/[^a-zA-Z0-9._-]/g, '_');
  const ext =
    getExtensionFromMime(params.mimeType || 'application/octet-stream') ||
    'bin';
  const key = `whatsapp/wa-admin-media/${safeId}.${ext}`;

  const result = await putFromUrl(key, params.downloadUrl, params.mimeType);
  if (result.success && result.url) {
    logger.debug(`[wa-admin-media] mirrored ${params.waMessageId} → ${key}`);
    return { ok: true, url: result.url };
  }
  logServerError('[wa-admin-media] mirror failed:', result.error ?? 'unknown');
  return { ok: false, error: result.error ?? 'upload_failed' };
}
