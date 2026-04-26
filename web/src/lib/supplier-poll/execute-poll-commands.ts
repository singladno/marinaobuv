import type { PollCommand } from './poll-commands';
import { prisma } from '@/lib/server/db';
import { tryCreateGreenApiAdminFetcher } from '@/lib/green-api-fetcher';
import { persistWaAdminOutgoingTextFromSendApi } from '@/lib/wa-admin-inbox';
import { logServerError, logger } from '@/lib/server/logger';
import { setOrderItemAvailabilityAndProductActive } from '@/lib/server/order-item-availability';
import { logOrderActivity } from '@/lib/server/order-activity';
import { createReplacementProposalInternal } from './create-replacement-internal';
import { mergeSupplierReplacementResolvedForPollRun } from './supplier-poll-replacement-gate';
import {
  resendPollProductImagesForChat,
  sendReplacementAskImageForPollItem,
  sendStockCheckImageForPollItem,
} from './execute-supplier-poll-outbound';

const MIN_STOCK =
  Number.isFinite(
    Number(process.env.SUPPLIER_POLL_MIN_STOCK_CONFIDENCE?.trim())
  ) && Number(process.env.SUPPLIER_POLL_MIN_STOCK_CONFIDENCE) >= 0
    ? Number(process.env.SUPPLIER_POLL_MIN_STOCK_CONFIDENCE)
    : 0.52;

async function nextSequence(pollRunId: string): Promise<number> {
  const agg = await prisma.supplierPollWaMessage.aggregate({
    where: { pollRunId },
    _max: { sequence: true },
  });
  return (agg._max.sequence ?? 0) + 1;
}

/**
 * Whitelist-исполнение команд от LLM. Удаления позиции из заказа нет; недоступность = деактивация через setOrderItem…
 */
export async function executeSupplierPollCommands(params: {
  pollRunId: string;
  orderId: string;
  chatId: string;
  adminUserId: string;
  commands: PollCommand[];
}): Promise<void> {
  const api = tryCreateGreenApiAdminFetcher();

  const providerRow = await prisma.supplierPollWaMessage.findFirst({
    where: { pollRunId: params.pollRunId, chatId: params.chatId },
    select: { providerId: true },
  });
  const providerId = providerRow?.providerId;
  if (!providerId) {
    logger.debug(
      '[supplier-poll] no provider for poll run, some commands may skip'
    );
  }

  for (const cmd of params.commands) {
    try {
      await executeOneCommand({ ...params, providerId, api, cmd });
    } catch (e) {
      logServerError(
        '[supplier-poll] command failed ' + JSON.stringify(cmd),
        e
      );
    }
  }
}

async function executeOneCommand(ctx: {
  pollRunId: string;
  orderId: string;
  chatId: string;
  adminUserId: string;
  providerId: string | null | undefined;
  api: ReturnType<typeof tryCreateGreenApiAdminFetcher>;
  cmd: PollCommand;
}): Promise<void> {
  const { cmd, orderId, pollRunId, chatId, adminUserId, providerId, api } = ctx;

  if (cmd.type === 'RESEND_PRODUCT_IMAGES') {
    const { ok, error, waMessageIds } = await resendPollProductImagesForChat({
      pollRunId,
      orderId,
      chatId,
    });
    if (!ok) {
      logServerError(
        '[supplier-poll] RESEND_PRODUCT_IMAGES failed:',
        new Error(error ?? 'unknown')
      );
    } else {
      logger.debug(
        `[supplier-poll] RESEND_PRODUCT_IMAGES sent ${waMessageIds.length} images`
      );
    }
    return;
  }

  if (cmd.type === 'ASK_REPLACEMENT_FOR_ITEM') {
    if (!api) {
      logServerError(
        '[supplier-poll] ASK_REPLACEMENT_FOR_ITEM: Green API not configured',
        new Error('no api')
      );
      return;
    }
    const r = await sendReplacementAskImageForPollItem({
      pollRunId,
      orderId,
      chatId,
      orderItemId: cmd.order_item_id,
    });
    if (!r.ok) {
      logServerError(
        '[supplier-poll] ASK_REPLACEMENT_FOR_ITEM failed:',
        new Error(r.error)
      );
    } else {
      logger.debug(
        `[supplier-poll] ASK_REPLACEMENT_FOR_ITEM sent for ${cmd.order_item_id} wa=${r.waMessageId}`
      );
    }
    return;
  }

  if (cmd.type === 'ASK_STOCK_CHECK_FOR_ITEM') {
    if (!api) {
      logServerError(
        '[supplier-poll] ASK_STOCK_CHECK_FOR_ITEM: Green API not configured',
        new Error('no api')
      );
      return;
    }
    const r = await sendStockCheckImageForPollItem({
      pollRunId,
      orderId,
      chatId,
      orderItemId: cmd.order_item_id,
    });
    if (!r.ok) {
      logServerError(
        '[supplier-poll] ASK_STOCK_CHECK_FOR_ITEM failed:',
        new Error(r.error)
      );
    } else {
      logger.debug(
        `[supplier-poll] ASK_STOCK_CHECK_FOR_ITEM sent for ${cmd.order_item_id} wa=${r.waMessageId}`
      );
    }
    return;
  }

  if (cmd.type === 'SEND_SUPPLIER_MESSAGE') {
    if (!api) {
      logServerError(
        '[supplier-poll] SEND_SUPPLIER_MESSAGE: Green API not configured',
        new Error('no api')
      );
      return;
    }
    if (!providerId) {
      logServerError(
        '[supplier-poll] SEND_SUPPLIER_MESSAGE: no provider on poll',
        new Error('no providerId')
      );
      return;
    }
    const { idMessage } = await api.sendTextMessage(chatId, cmd.text);
    const seq = await nextSequence(pollRunId);
    await prisma.supplierPollWaMessage.create({
      data: {
        waMessageId: idMessage,
        pollRunId,
        providerId,
        chatId,
        kind: 'OUT_AI_MESSAGE',
        orderItemId: null,
        sequence: seq,
      },
    });
    await persistWaAdminOutgoingTextFromSendApi({
      chatId,
      waMessageId: idMessage,
      text: cmd.text,
    });
    await logOrderActivity({
      orderId,
      kind: 'poll_ai_wa_message_sent',
      title: 'Сообщение поставщику (ИИ, опрос)',
      details: { waMessageId: idMessage, preview: cmd.text.slice(0, 200) },
      actorType: 'AI_ASSISTANT',
    });
    return;
  }

  if (cmd.type === 'SET_ITEM_STOCK') {
    if (cmd.stock === 'unclear') {
      return;
    }

    const item = await prisma.orderItem.findFirst({
      where: { id: cmd.order_item_id, orderId },
      select: { id: true, name: true, article: true },
    });
    if (!item) {
      logger.debug(
        `[supplier-poll] SET_ITEM_STOCK: item ${cmd.order_item_id} not in order`
      );
      return;
    }

    const conf = cmd.confidence;
    if (conf < MIN_STOCK) {
      logger.info(
        `[supplier-poll] SET_ITEM_STOCK skipped: confidence ${conf} < MIN_STOCK ${MIN_STOCK} (set SUPPLIER_POLL_MIN_STOCK_CONFIDENCE) item=${cmd.order_item_id} stock=${cmd.stock}`
      );
      return;
    }

    if (cmd.stock === 'available') {
      await setOrderItemAvailabilityAndProductActive({
        itemId: item.id,
        isAvailable: true,
      });
      await logOrderActivity({
        orderId,
        kind: 'poll_item_available_ai',
        title: `Позиция «${item.name}» отмечена как в наличии`,
        details: {
          orderItemId: item.id,
          article: item.article,
        },
        actorType: 'AI_ASSISTANT',
      });
      return;
    }

    if (cmd.stock === 'unavailable') {
      await setOrderItemAvailabilityAndProductActive({
        itemId: item.id,
        isAvailable: false,
      });
      await logOrderActivity({
        orderId,
        kind: 'poll_item_unavailable_ai',
        title: `Товар деактивирован (нет в наличии): «${item.name}»`,
        details: {
          orderItemId: item.id,
          article: item.article,
        },
        actorType: 'AI_ASSISTANT',
      });
    }
    return;
  }

  if (cmd.type === 'PROPOSE_REPLACEMENT_FROM_WA') {
    if (cmd.confidence < MIN_STOCK) {
      return;
    }

    const item = await prisma.orderItem.findFirst({
      where: { id: cmd.order_item_id, orderId },
      select: { id: true, name: true, article: true },
    });
    if (!item) return;

    if (cmd.replacement !== 'offered_with_image') {
      await mergeSupplierReplacementResolvedForPollRun(pollRunId, item.id);
      return;
    }

    let waId = cmd.replacement_image_wa_message_id?.trim() || null;
    if (!waId) {
      const lastImg = await prisma.waAdminMessage.findFirst({
        where: {
          chatId,
          isFromMe: false,
          typeMessage: {
            in: ['imageMessage', 'documentMessage', 'fileMessage'],
          },
        },
        orderBy: [{ timestamp: 'desc' }],
        select: { waMessageId: true },
      });
      waId = lastImg?.waMessageId ?? null;
    }

    if (!waId) return;

    const media = await prisma.waAdminMessage.findUnique({
      where: { waMessageId: waId },
      select: { mediaS3Url: true },
    });
    const url = media?.mediaS3Url;
    if (!url) {
      return;
    }

    try {
      await createReplacementProposalInternal({
        orderItemId: item.id,
        adminUserId,
        replacementImageUrl: url,
        replacementImageKey: null,
        adminComment:
          cmd.notes?.trim() ||
          'Предложение замены от поставщика (автоопрос, ИИ)',
      });
      await mergeSupplierReplacementResolvedForPollRun(pollRunId, item.id);
    } catch (e) {
      if (e instanceof Error && e.message === 'ORDER_HAS_NO_CLIENT') {
        logger.debug(
          `[supplier-poll] skip replacement (no client) item ${item.id}`
        );
        await mergeSupplierReplacementResolvedForPollRun(pollRunId, item.id);
      } else if (
        e instanceof Error &&
        e.message === 'REPLACEMENT_ALREADY_PENDING'
      ) {
        await mergeSupplierReplacementResolvedForPollRun(pollRunId, item.id);
      } else {
        logServerError('[supplier-poll] replacement create failed:', e);
      }
    }
  }
}
