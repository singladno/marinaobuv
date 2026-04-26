import {
  SupplierPollRunStatus,
  SupplierPollWaKind,
  type SupplierPollMode,
} from '@prisma/client';

import { prisma } from '@/lib/server/db';
import { tryCreateGreenApiAdminFetcher } from '@/lib/green-api-fetcher';
import { getExtensionFromMime, putBuffer } from '@/lib/s3u';
import {
  persistWaAdminOutgoingImageFromSendApi,
  persistWaAdminOutgoingTextFromSendApi,
} from '@/lib/wa-admin-inbox';
import { logOrderActivity } from '@/lib/server/order-activity';
import { logServerError, logger } from '@/lib/server/logger';

import { formatBoxesRu } from './format-boxes';
import { phoneToWaChatId } from './phone-to-chat-id';

export type SupplierPollOutboundResult = {
  providerId: string;
  providerName: string;
  chatId: string | null;
  sent: boolean;
  error?: string;
  waMessageIds: string[];
};

type Grouped = {
  providerId: string;
  providerName: string;
  phone: string | null;
  items: Array<{
    id: string;
    qty: number;
    imageUrl: string | null;
    sortIndex: number;
  }>;
};

function groupOrderItemsByProvider(
  items: {
    id: string;
    qty: number;
    product: {
      provider: {
        id: string;
        name: string;
        phone: string | null;
      } | null;
      images: Array<{ url: string; sort: number }>;
    };
  }[]
): Grouped[] {
  const map = new Map<string, Grouped>();
  let idx = 0;
  for (const item of items) {
    const p = item.product.provider;
    if (!p) {
      idx += 1;
      continue;
    }
    const g =
      map.get(p.id) ??
      ({
        providerId: p.id,
        providerName: p.name,
        phone: p.phone,
        items: [],
      } as Grouped);
    const images = [...item.product.images].sort((a, b) => a.sort - b.sort);
    const imageUrl = images[0]?.url ?? null;
    g.items.push({
      id: item.id,
      qty: item.qty,
      imageUrl,
      sortIndex: idx++,
    });
    map.set(p.id, g);
  }
  return [...map.values()];
}

function extensionFromMime(mime: string): string {
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  return 'jpg';
}

type GreenApi = NonNullable<ReturnType<typeof tryCreateGreenApiAdminFetcher>>;

/**
 * One OUT_IMAGE (or follow-up) product photo. Caller supplies caption + wa kind. Caller manages `sequence`.
 */
async function sendPollItemImageMessage(
  api: GreenApi,
  p: {
    chatId: string;
    pollRunId: string;
    providerId: string;
    item: { id: string; qty: number; imageUrl: string };
    sequence: number;
    caption: string;
    waKind: SupplierPollWaKind;
  }
): Promise<{ ok: true; waMessageId: string } | { ok: false; error: string }> {
  const { chatId, pollRunId, providerId, item, sequence, caption, waKind } = p;
  try {
    const imgRes = await fetch(item.imageUrl);
    if (!imgRes.ok) {
      return { ok: false, error: `HTTP ${imgRes.status}` };
    }
    const buf = Buffer.from(await imgRes.arrayBuffer());
    const mime =
      imgRes.headers.get('content-type')?.split(';')[0]?.trim() || 'image/jpeg';
    const ext = extensionFromMime(mime);
    const cap = caption.slice(0, 20_000);
    const blob = new Blob([buf], { type: mime });

    const { idMessage } = await api.sendFileByUpload({
      chatId,
      file: blob,
      fileName: `item-${item.id}.${ext}`,
      caption: cap,
    });

    let mediaS3Url: string | null = null;
    try {
      const safeId = idMessage.replace(/[^a-zA-Z0-9._-]/g, '_');
      const s3Ext = getExtensionFromMime(mime) || ext;
      const key = `whatsapp/wa-admin-media/${safeId}.${s3Ext}`;
      const up = await putBuffer(key, buf, mime);
      if (up.success && up.url) {
        mediaS3Url = up.url;
      } else if (up.error) {
        logServerError(
          '[supplier-poll] S3 mirror after send (same path as admin upload):',
          up.error
        );
      }
    } catch (s3Err) {
      logServerError('[supplier-poll] S3 mirror after send failed:', s3Err);
    }

    await prisma.supplierPollWaMessage.create({
      data: {
        waMessageId: idMessage,
        pollRunId,
        providerId,
        chatId,
        kind: waKind,
        orderItemId: item.id,
        sequence,
      },
    });

    try {
      await persistWaAdminOutgoingImageFromSendApi({
        chatId,
        waMessageId: idMessage,
        caption: cap,
        mediaS3Url,
      });
    } catch (e) {
      logServerError('[supplier-poll] persist outgoing image failed:', e);
    }

    return { ok: true, waMessageId: idMessage };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Ошибка отправки фото',
    };
  }
}

type PrepareParams = {
  orderId: string;
  mode: SupplierPollMode;
  createdByUserId: string;
};

/**
 * Validate, create a run in SENDING (no messages yet). Call `runSupplierPollOutboundWork`
 * in the background (e.g. via `after()`).
 */
export async function prepareSupplierPollOutbound(
  params: PrepareParams
): Promise<{ runId: string }> {
  const existing = await prisma.supplierPollRun.findFirst({
    where: {
      orderId: params.orderId,
      status: {
        in: [SupplierPollRunStatus.IN_PROGRESS, SupplierPollRunStatus.SENDING],
      },
    },
    select: { id: true },
  });
  if (existing) {
    throw new Error('IN_PROGRESS_POLL_EXISTS');
  }

  const api = tryCreateGreenApiAdminFetcher();
  if (!api) {
    throw new Error('GREEN_API_ADMIN_NOT_CONFIGURED');
  }
  // Touch fetcher in prepare so we fail fast before creating a run
  void api;

  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              provider: true,
              images: {
                select: { url: true, sort: true },
                orderBy: { sort: 'asc' },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new Error('ORDER_NOT_FOUND');
  }

  const groups = groupOrderItemsByProvider(order.items);
  if (groups.length === 0) {
    throw new Error('NO_PROVIDER_ITEMS');
  }

  const chatIdsToTouch = groups
    .map(g => phoneToWaChatId(g.phone))
    .filter((c): c is string => Boolean(c));

  if (chatIdsToTouch.length > 0) {
    await prisma.supplierPollRun.updateMany({
      where: {
        status: 'IN_PROGRESS',
        waMessages: { some: { chatId: { in: chatIdsToTouch } } },
      },
      data: { status: 'CANCELLED' },
    });
  }

  const run = await prisma.supplierPollRun.create({
    data: {
      orderId: params.orderId,
      mode: params.mode,
      createdByUserId: params.createdByUserId,
      status: 'SENDING',
    },
  });

  return { runId: run.id };
}

/**
 * Send photos and questions to providers, then set run to IN_PROGRESS or CANCELLED.
 * Safe to run in `after()` — caller should catch and log.
 */
export async function runSupplierPollOutboundWork(
  runId: string
): Promise<{ results: SupplierPollOutboundResult[] }> {
  const run = await prisma.supplierPollRun.findUnique({
    where: { id: runId },
  });

  if (!run) {
    logger.warn(
      `[supplier-poll] runSupplierPollOutboundWork: run ${runId} not found`
    );
    return { results: [] };
  }
  if (run.status !== 'SENDING') {
    logger.debug(
      `[supplier-poll] runSupplierPollOutboundWork: run ${runId} status ${run.status}, skip`
    );
    return { results: [] };
  }

  const api = tryCreateGreenApiAdminFetcher();
  if (!api) {
    await prisma.supplierPollRun.update({
      where: { id: runId },
      data: { status: 'CANCELLED' },
    });
    return { results: [] };
  }

  const order = await prisma.order.findUnique({
    where: { id: run.orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              provider: true,
              images: {
                select: { url: true, sort: true },
                orderBy: { sort: 'asc' },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    await prisma.supplierPollRun.update({
      where: { id: runId },
      data: { status: 'CANCELLED' },
    });
    return { results: [] };
  }

  const mode = run.mode;
  const groups = groupOrderItemsByProvider(order.items);
  const results: SupplierPollOutboundResult[] = [];
  let sequence = 0;

  try {
    for (const group of groups) {
      const chatId = phoneToWaChatId(group.phone);
      const baseResult: SupplierPollOutboundResult = {
        providerId: group.providerId,
        providerName: group.providerName,
        chatId,
        sent: false,
        waMessageIds: [],
      };

      if (!chatId) {
        results.push({
          ...baseResult,
          error: 'У поставщика не указан телефон',
        });
        continue;
      }

      const orderItemIdsInGroup = group.items.map(i => i.id);

      const itemsWithImage = group.items.filter(i => i.imageUrl);
      if (itemsWithImage.length === 0 && group.items.length > 0) {
        results.push({
          ...baseResult,
          error: 'Нет изображений у товаров для отправки',
        });
        continue;
      }

      const question =
        mode === 'STOCK_ONLY'
          ? 'Здравствуйте. Эти модели есть в наличии?'
          : 'Здравствуйте. Эти модели есть в наличии? И пришлите, пожалуйста, счёт на оплату.';

      /** Сначала фото позиций — поставщик видит товар до общего вопроса. */
      let groupOk = true;
      for (const item of group.items) {
        if (!item.imageUrl) {
          logger.debug(
            `[supplier-poll] order item ${item.id} has no image, skipping photo`
          );
          continue;
        }

        const sent = await sendPollItemImageMessage(api, {
          chatId,
          pollRunId: run.id,
          providerId: group.providerId,
          item: {
            id: item.id,
            qty: item.qty,
            imageUrl: item.imageUrl,
          },
          sequence: sequence++,
          caption: formatBoxesRu(item.qty),
          waKind: 'OUT_IMAGE',
        });
        if (!sent.ok) {
          logServerError(
            `[supplier-poll] send image for item ${item.id}:`,
            new Error(sent.error)
          );
          groupOk = false;
          baseResult.error = sent.error;
          break;
        }
        baseResult.waMessageIds.push(sent.waMessageId);
        baseResult.sent = true;
      }

      if (!groupOk) {
        results.push(baseResult);
        continue;
      }

      try {
        const { idMessage: qId } = await api.sendTextMessage(chatId, question);
        await prisma.supplierPollWaMessage.create({
          data: {
            waMessageId: qId,
            pollRunId: run.id,
            providerId: group.providerId,
            chatId,
            kind: 'OUT_QUESTION' as SupplierPollWaKind,
            orderItemIdsJson: orderItemIdsInGroup,
            sequence: sequence++,
          },
        });
        try {
          await persistWaAdminOutgoingTextFromSendApi({
            chatId,
            waMessageId: qId,
            text: question,
          });
        } catch (e) {
          logServerError(
            '[supplier-poll] persist outgoing question failed:',
            e
          );
        }
        baseResult.waMessageIds.push(qId);
        baseResult.sent = true;
      } catch (e) {
        baseResult.error =
          e instanceof Error ? e.message : 'Ошибка отправки вопроса';
        logServerError('[supplier-poll] send question:', e);
        results.push(baseResult);
        continue;
      }

      results.push(baseResult);
    }
  } catch (e) {
    logServerError('[supplier-poll] runSupplierPollOutboundWork fatal:', e);
    const fresh = await prisma.supplierPollRun.findUnique({
      where: { id: runId },
      select: { status: true },
    });
    if (fresh?.status === 'SENDING') {
      const msgCount = await prisma.supplierPollWaMessage.count({
        where: { pollRunId: runId },
      });
      await prisma.supplierPollRun.update({
        where: { id: runId },
        data: { status: msgCount > 0 ? 'IN_PROGRESS' : 'CANCELLED' },
      });
    }
    throw e;
  }

  const anySent = results.some(r => r.sent);
  if (!anySent) {
    await prisma.supplierPollRun.update({
      where: { id: runId },
      data: { status: 'CANCELLED' },
    });
  } else {
    await prisma.supplierPollRun.update({
      where: { id: runId },
      data: { status: 'IN_PROGRESS' },
    });
  }

  return { results };
}

/** Подпись к фото при вопросе о замене (текст фиксирован в коде, не из LLM). */
export function getReplacementAskCaption(): string {
  const t = process.env.SUPPLIER_POLL_REPLACEMENT_ASK_TEXT?.trim();
  return t && t.length > 0 ? t : 'Похожие есть?';
}

/** Подпись к фото при уточнении наличия по одной позиции (не из LLM). */
export function getStockCheckAskCaption(): string {
  const t = process.env.SUPPLIER_POLL_STOCK_ASK_TEXT?.trim();
  return t && t.length > 0 ? t : 'Эта модель есть в наличии?';
}

/**
 * Одна позиция опроса: **одно** WA-сообщение (фото + короткая подпись) — вопрос о замене.
 * kind OUT_FOLLOWUP_REPLACEMENT — в ленте/GPT отделимо от исходного OUT_IMAGE.
 */
export async function sendReplacementAskImageForPollItem(p: {
  pollRunId: string;
  orderId: string;
  chatId: string;
  orderItemId: string;
}): Promise<{ ok: true; waMessageId: string } | { ok: false; error: string }> {
  const { pollRunId, orderId, chatId, orderItemId } = p;
  const caption = getReplacementAskCaption();

  const run = await prisma.supplierPollRun.findFirst({
    where: { id: pollRunId, orderId, status: 'IN_PROGRESS' },
    select: { id: true },
  });
  if (!run) {
    return { ok: false, error: 'Нет активного опроса (IN_PROGRESS)' };
  }

  const api = tryCreateGreenApiAdminFetcher();
  if (!api) {
    return { ok: false, error: 'Green API не настроен' };
  }

  const line = await prisma.orderItem.findFirst({
    where: { id: orderItemId, orderId },
    include: {
      product: {
        include: {
          provider: true,
          images: {
            select: { url: true, sort: true },
            orderBy: { sort: 'asc' },
          },
        },
      },
    },
  });
  if (!line?.product?.provider) {
    return { ok: false, error: 'Позиция не найдена или нет поставщика' };
  }
  if (phoneToWaChatId(line.product.provider.phone) !== chatId) {
    return {
      ok: false,
      error: 'Чат не совпадает с поставщиком этой позиции',
    };
  }
  const images = [...line.product.images].sort((a, b) => a.sort - b.sort);
  const imageUrl = images[0]?.url;
  if (!imageUrl) {
    return { ok: false, error: 'Нет фото товара для позиции' };
  }

  const seqAgg = await prisma.supplierPollWaMessage.aggregate({
    where: { pollRunId },
    _max: { sequence: true },
  });
  const sequence = (seqAgg._max.sequence ?? 0) + 1;

  const r = await sendPollItemImageMessage(api, {
    chatId,
    pollRunId,
    providerId: line.product.provider.id,
    item: { id: line.id, qty: line.qty, imageUrl },
    sequence,
    caption,
    waKind: 'OUT_FOLLOWUP_REPLACEMENT',
  });
  if (!r.ok) {
    return { ok: false, error: r.error };
  }

  try {
    await logOrderActivity({
      orderId,
      kind: 'poll_replacement_ask_sent',
      title: 'Вопрос о замене поставщику (фото + подпись)',
      details: { pollRunId, chatId, orderItemId, waMessageId: r.waMessageId },
      actorType: 'AI_ASSISTANT',
    });
  } catch {
    /* best-effort */
  }

  return { ok: true, waMessageId: r.waMessageId };
}

/**
 * Одна позиция: одно исходящее (фото + короткая фиксированная подпись) — вопрос о наличии, без длинного текста от LLM.
 * kind OUT_FOLLOWUP_STOCK.
 */
export async function sendStockCheckImageForPollItem(p: {
  pollRunId: string;
  orderId: string;
  chatId: string;
  orderItemId: string;
}): Promise<{ ok: true; waMessageId: string } | { ok: false; error: string }> {
  const { pollRunId, orderId, chatId, orderItemId } = p;
  const caption = getStockCheckAskCaption();

  const run = await prisma.supplierPollRun.findFirst({
    where: { id: pollRunId, orderId, status: 'IN_PROGRESS' },
    select: { id: true },
  });
  if (!run) {
    return { ok: false, error: 'Нет активного опроса (IN_PROGRESS)' };
  }

  const api = tryCreateGreenApiAdminFetcher();
  if (!api) {
    return { ok: false, error: 'Green API не настроен' };
  }

  const line = await prisma.orderItem.findFirst({
    where: { id: orderItemId, orderId },
    include: {
      product: {
        include: {
          provider: true,
          images: {
            select: { url: true, sort: true },
            orderBy: { sort: 'asc' },
          },
        },
      },
    },
  });
  if (!line?.product?.provider) {
    return { ok: false, error: 'Позиция не найдена или нет поставщика' };
  }
  if (phoneToWaChatId(line.product.provider.phone) !== chatId) {
    return {
      ok: false,
      error: 'Чат не совпадает с поставщиком этой позиции',
    };
  }
  const images = [...line.product.images].sort((a, b) => a.sort - b.sort);
  const imageUrl = images[0]?.url;
  if (!imageUrl) {
    return { ok: false, error: 'Нет фото товара для позиции' };
  }

  const seqAgg = await prisma.supplierPollWaMessage.aggregate({
    where: { pollRunId },
    _max: { sequence: true },
  });
  const sequence = (seqAgg._max.sequence ?? 0) + 1;

  const r = await sendPollItemImageMessage(api, {
    chatId,
    pollRunId,
    providerId: line.product.provider.id,
    item: { id: line.id, qty: line.qty, imageUrl },
    sequence,
    caption,
    waKind: SupplierPollWaKind.OUT_FOLLOWUP_STOCK,
  });
  if (!r.ok) {
    return { ok: false, error: r.error };
  }

  try {
    await logOrderActivity({
      orderId,
      kind: 'poll_stock_ask_sent',
      title: 'Вопрос о наличии (фото + подпись, одна позиция)',
      details: { pollRunId, chatId, orderItemId, waMessageId: r.waMessageId },
      actorType: 'AI_ASSISTANT',
    });
  } catch {
    /* best-effort */
  }

  return { ok: true, waMessageId: r.waMessageId };
}

/**
 * Повторно отправить фото товаров по чату опроса (по просьбе поставщика / если не дошли).
 * Только при активном раунде; те же OUT_IMAGE, что и при старте опроса.
 */
export async function resendPollProductImagesForChat(params: {
  pollRunId: string;
  orderId: string;
  chatId: string;
}): Promise<{ ok: boolean; error?: string; waMessageIds: string[] }> {
  const { pollRunId, orderId, chatId } = params;
  const waMessageIds: string[] = [];

  const run = await prisma.supplierPollRun.findFirst({
    where: { id: pollRunId, orderId, status: 'IN_PROGRESS' },
    select: { id: true },
  });
  if (!run) {
    return {
      ok: false,
      error: 'Нет активного опроса (IN_PROGRESS)',
      waMessageIds,
    };
  }

  const api = tryCreateGreenApiAdminFetcher();
  if (!api) {
    return { ok: false, error: 'Green API не настроен', waMessageIds };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              provider: true,
              images: {
                select: { url: true, sort: true },
                orderBy: { sort: 'asc' },
              },
            },
          },
        },
      },
    },
  });
  if (!order) {
    return { ok: false, error: 'Заказ не найден', waMessageIds };
  }

  const groups = groupOrderItemsByProvider(order.items);
  const group = groups.find(g => phoneToWaChatId(g.phone) === chatId);
  if (!group) {
    return {
      ok: false,
      error: 'Чат не совпадает с поставщиком по заказу',
      waMessageIds,
    };
  }

  const toSend = group.items.filter(i => i.imageUrl);
  if (toSend.length === 0) {
    return { ok: false, error: 'Нет фото товаров для отправки', waMessageIds };
  }

  const seqAgg = await prisma.supplierPollWaMessage.aggregate({
    where: { pollRunId },
    _max: { sequence: true },
  });
  let sequence = (seqAgg._max.sequence ?? 0) + 1;

  for (const item of toSend) {
    const r = await sendPollItemImageMessage(api, {
      chatId,
      pollRunId,
      providerId: group.providerId,
      item: {
        id: item.id,
        qty: item.qty,
        imageUrl: item.imageUrl!,
      },
      sequence: sequence++,
      caption: formatBoxesRu(item.qty),
      waKind: 'OUT_IMAGE',
    });
    if (!r.ok) {
      return { ok: false, error: r.error, waMessageIds };
    }
    waMessageIds.push(r.waMessageId);
  }

  try {
    await logOrderActivity({
      orderId,
      kind: 'poll_resend_images',
      title: 'Повторно отправлены фото позиций поставщику (ИИ, опрос)',
      details: { pollRunId, chatId, count: waMessageIds.length },
      actorType: 'AI_ASSISTANT',
    });
  } catch {
    /* best-effort */
  }

  return { ok: true, waMessageIds };
}

/** Synchronous full run (e.g. tests): prepare + work in one process. */
export async function executeSupplierPollOutbound(
  params: PrepareParams
): Promise<{
  runId: string;
  results: SupplierPollOutboundResult[];
}> {
  const { runId } = await prepareSupplierPollOutbound(params);
  const { results } = await runSupplierPollOutboundWork(runId);
  return { runId, results };
}
