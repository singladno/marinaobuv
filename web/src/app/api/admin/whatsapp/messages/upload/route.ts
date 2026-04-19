import { NextRequest, NextResponse } from 'next/server';

import { tryCreateGreenApiAdminFetcher } from '@/lib/green-api-fetcher';
import { persistWaAdminOutgoingImageFromSendApi } from '@/lib/wa-admin-inbox';
import { requireAuth } from '@/lib/server/auth-helpers';
import { logServerError } from '@/lib/server/logger';
import { isValidAdminWaChatId } from '@/lib/server/wa-chat-id';

const MAX_BYTES = Math.min(99 * 1024 * 1024, 25 * 1024 * 1024); // 25 MB cap for admin UI

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/bmp',
]);

function isAllowedImage(file: File): boolean {
  if (file.type && ALLOWED_IMAGE_TYPES.has(file.type)) return true;
  const n = file.name.toLowerCase();
  return /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i.test(n);
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
        error: 'Допустимы только изображения (JPEG, PNG, GIF, WebP, HEIC, BMP)',
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
          : fileEntry.type === 'image/heic' || fileEntry.type === 'image/heif'
            ? 'image.heic'
            : fileEntry.type === 'image/bmp'
              ? 'image.bmp'
              : 'image.jpg');

  try {
    const result = await api.sendFileByUpload({
      chatId,
      file: fileEntry,
      fileName,
      caption: caption || undefined,
    });
    try {
      await persistWaAdminOutgoingImageFromSendApi({
        chatId,
        waMessageId: result.idMessage,
        caption: caption || undefined,
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
