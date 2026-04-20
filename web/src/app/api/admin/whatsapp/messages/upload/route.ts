import { NextRequest, NextResponse } from 'next/server';

import { tryCreateGreenApiAdminFetcher } from '@/lib/green-api-fetcher';
import { persistWaAdminOutgoingImageFromSendApi } from '@/lib/wa-admin-inbox';
import { requireAuth } from '@/lib/server/auth-helpers';
import { logServerError } from '@/lib/server/logger';
import { isValidAdminWaChatId } from '@/lib/server/wa-chat-id';
import { getExtensionFromMime, putBuffer } from '@/lib/s3u';

const MAX_BYTES = Math.min(99 * 1024 * 1024, 25 * 1024 * 1024); // 25 MB cap for admin UI

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif',
  'image/bmp',
]);

function isAllowedImage(file: File): boolean {
  if (file.type && ALLOWED_IMAGE_TYPES.has(file.type)) return true;
  const n = file.name.toLowerCase();
  return /\.(jpe?g|png|gif|webp|avif|heic|heif|bmp)$/i.test(n);
}

/** When the browser omits `type`, infer from extension so S3/Green get a correct MIME. */
function inferImageMime(file: File): string {
  if (file.type && file.type.startsWith('image/')) return file.type;
  const n = file.name.toLowerCase();
  if (n.endsWith('.avif')) return 'image/avif';
  if (n.endsWith('.webp')) return 'image/webp';
  if (n.endsWith('.png')) return 'image/png';
  if (n.endsWith('.gif')) return 'image/gif';
  if (n.endsWith('.bmp')) return 'image/bmp';
  if (n.endsWith('.heic') || n.endsWith('.heif')) return 'image/heic';
  if (/\.(jpe?g|jpeg)$/i.test(n)) return 'image/jpeg';
  return 'image/jpeg';
}

/**
 * POST multipart/form-data: chatId, file (image), optional caption.
 * Forwards to Green API SendFileByUpload (media host).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, 'ADMIN');
  if (auth.error) return auth.error;

  const api = tryCreateGreenApiAdminFetcher();
  if (!api) {
    return NextResponse.json(
      { error: 'Green API не настроен на сервере' },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: 'Ожидается multipart/form-data' },
      { status: 400 }
    );
  }

  const chatIdRaw = formData.get('chatId');
  const chatId = typeof chatIdRaw === 'string' ? chatIdRaw.trim() : '';
  if (!chatId || !isValidAdminWaChatId(chatId)) {
    return NextResponse.json({ error: 'Некорректный chatId' }, { status: 400 });
  }

  const fileEntry = formData.get('file');
  if (!(fileEntry instanceof File) || fileEntry.size === 0) {
    return NextResponse.json(
      { error: 'Добавьте файл изображения' },
      { status: 400 }
    );
  }

  if (fileEntry.size > MAX_BYTES) {
    return NextResponse.json(
      {
        error: `Файл слишком большой (макс. ${Math.floor(MAX_BYTES / (1024 * 1024))} МБ)`,
      },
      { status: 400 }
    );
  }

  if (!isAllowedImage(fileEntry)) {
    return NextResponse.json(
      {
        error:
          'Допустимы только изображения (JPEG, PNG, GIF, WebP, AVIF, HEIC, BMP)',
      },
      { status: 400 }
    );
  }

  const captionRaw = formData.get('caption');
  const caption =
    typeof captionRaw === 'string' ? captionRaw.trim().slice(0, 20_000) : '';

  const fileName =
    fileEntry.name?.trim() ||
    (fileEntry.type === 'image/png'
      ? 'image.png'
      : fileEntry.type === 'image/gif'
        ? 'image.gif'
        : fileEntry.type === 'image/webp'
          ? 'image.webp'
          : fileEntry.type === 'image/avif'
            ? 'image.avif'
            : fileEntry.type === 'image/heic' || fileEntry.type === 'image/heif'
              ? 'image.heic'
              : fileEntry.type === 'image/bmp'
                ? 'image.bmp'
                : 'image.jpg');

  const mime = inferImageMime(fileEntry);

  /** Read once: Green upload may consume the stream; S3 mirror needs the same bytes. */
  let imageBuf: Buffer;
  try {
    imageBuf = Buffer.from(await fileEntry.arrayBuffer());
  } catch {
    return NextResponse.json(
      { error: 'Не удалось прочитать файл' },
      { status: 400 }
    );
  }

  const fileForGreen = new Blob([imageBuf], { type: mime });

  try {
    const result = await api.sendFileByUpload({
      chatId,
      file: fileForGreen,
      fileName,
      caption: caption || undefined,
    });

    let mediaS3Url: string | null = null;
    try {
      const safeId = result.idMessage.replace(/[^a-zA-Z0-9._-]/g, '_');
      const ext = getExtensionFromMime(mime) || 'jpg';
      const key = `whatsapp/wa-admin-media/${safeId}.${ext}`;
      const up = await putBuffer(key, imageBuf, mime);
      if (up.success && up.url) {
        mediaS3Url = up.url;
      } else if (up.error) {
        logServerError(
          '[admin/whatsapp/messages/upload] S3 mirror after send:',
          up.error
        );
      }
    } catch (s3Err) {
      logServerError(
        '[admin/whatsapp/messages/upload] S3 mirror after send failed:',
        s3Err
      );
    }

    try {
      await persistWaAdminOutgoingImageFromSendApi({
        chatId,
        waMessageId: result.idMessage,
        caption: caption || undefined,
        mediaS3Url,
      });
    } catch (persistErr) {
      logServerError(
        '[admin/whatsapp/messages/upload] persist outgoing image failed:',
        persistErr
      );
    }
    return NextResponse.json({ idMessage: result.idMessage });
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : 'Ошибка загрузки файла в Green API';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
