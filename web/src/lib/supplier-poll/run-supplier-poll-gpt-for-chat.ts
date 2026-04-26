import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/server/db';
import { extractQuotedTargetMessageId } from '@/lib/wa-admin-green-message-text';
import { logger } from '@/lib/server/logger';

import { supplierPollScheduledGapMs } from './supplier-poll-chat-state';
import { executeSupplierPollCommands } from './execute-poll-commands';
import { runSupplierPollGpt } from './gpt';
import type { PollCommand } from './poll-commands';

export const supplierPollRunGptInclude = {
  order: {
    select: {
      id: true,
      orderNumber: true,
    },
  },
  waMessages: true,
} as const;

export type SupplierPollRunForGpt = Prisma.SupplierPollRunGetPayload<{
  include: typeof supplierPollRunGptInclude;
}>;

function pollCommandsSendToSupplier(commands: PollCommand[]): boolean {
  return commands.some(
    c =>
      c.type === 'SEND_SUPPLIER_MESSAGE' ||
      c.type === 'RESEND_PRODUCT_IMAGES' ||
      c.type === 'ASK_REPLACEMENT_FOR_ITEM' ||
      c.type === 'ASK_STOCK_CHECK_FOR_ITEM'
  );
}

/**
 * Сразу после входящего от поставщика (webhook) не шлём длинные тексты и не инициируем
 * уточнения по **другим** позициям: это только план (cron) после SUPPLIER_POLL_SCHEDULED_GAP.
 */
function filterWebhookNoImmediateFollowup(
  commands: PollCommand[]
): PollCommand[] {
  return commands.filter(
    c =>
      c.type !== 'SEND_SUPPLIER_MESSAGE' &&
      c.type !== 'ASK_STOCK_CHECK_FOR_ITEM'
  );
}

async function anchorTimestampForChat(
  pollRunId: string,
  chatId: string
): Promise<bigint | null> {
  const links = await prisma.supplierPollWaMessage.findMany({
    where: { pollRunId, chatId },
    select: { waMessageId: true },
  });
  if (links.length === 0) return null;
  const ids = links.map(l => l.waMessageId);
  const agg = await prisma.waAdminMessage.aggregate({
    where: { waMessageId: { in: ids } },
    _min: { timestamp: true },
  });
  return agg._min.timestamp;
}

function parseOrderItemIdsJson(j: Prisma.JsonValue | null): string[] {
  if (j == null) return [];
  if (!Array.isArray(j)) return [];
  return j.map(x => String(x));
}

function waAdminTimestampToDate(ts: bigint): Date {
  const n = Number(ts);
  return new Date(n > 1e12 ? n : n * 1000);
}

/** Последний исходящий текст от ИИ в этом чате опроса (без классификации; решение — у модели). */
async function getLastOutAiForPollRunChat(
  pollRunId: string,
  chatId: string
): Promise<{ at: Date; textStart: string } | null> {
  const links = await prisma.supplierPollWaMessage.findMany({
    where: { pollRunId, chatId, kind: 'OUT_AI_MESSAGE' },
    select: { waMessageId: true },
  });
  if (links.length === 0) return null;
  const ids = links.map(l => l.waMessageId);
  const m = await prisma.waAdminMessage.findFirst({
    where: { waMessageId: { in: ids } },
    orderBy: { timestamp: 'desc' },
    select: { textMessage: true, timestamp: true },
  });
  if (!m) return null;
  const raw = (m.textMessage && m.textMessage.trim()) || '';
  const textStart = raw.length > 500 ? raw.slice(0, 500) + '…' : raw;
  return {
    at: waAdminTimestampToDate(m.timestamp),
    textStart: textStart || '—',
  };
}

function baseSystemExtra(run: {
  mode: string;
  order: { orderNumber: string };
}): string {
  return `Режим опроса: ${run.mode}. Заказ МаринаОбувь №${run.order.orderNumber}.
Пиши от имени магазина; ответы **на конкретную** последнюю фразу поставщика, **без** копипаста предыдущего своего длинного сообщения.
Если в ленте уже есть [OUT_QUESTION] с вопросом о наличии — **не** повторяй длинный перечень позиций заказа и **не** благодари «за ответ», пока поставщик по сути не ответил по наличию. При **webhook** и **частичном** ответе («только эта/эти в наличии / нет…») — **нельзя** \`SEND\` в духе «а по **остальным** позициям ждём отметку»; только \`SET_ITEM_STOCK\` / \`NO_OP\` / краткое **без** остатка. При одном только «здравствуйте» / копии вопроса — короткое (без «остальных») или NO_OP.
**Нет в наличии / уточнение замены:** вопрос «есть ли аналог?» — **только** \`ASK_REPLACEMENT_FOR_ITEM\` (фото + «Похожие есть?»), не в \`SEND\`.
**Проверка наличия по ещё не закрытой позиции** (не аналог) — **только** \`ASK_STOCK_CHECK_FOR_ITEM\` на **одну** \`order_item_id\` (фото + фикс. короткий вопрос). **Запрещён** \`SEND\` вроде «уточните по позициям: A и B»; две позиции = **две** \`ASK_STOCK_CHECK_FOR_ITEM\` подряд, не один текст.
**Мгновенный webhook:** исполнитель **снимает** \`SEND_SUPPLIER_MESSAGE\` и \`ASK_STOCK_CHECK_FOR_ITEM\` из ответа (эти действия — в фоне после паузы, как у cron). Пока идёт переписка — **только** \`SET_ITEM_STOCK\` / \`ASK_REPLACEMENT\` / \`RESEND\` / \`PROPOSE\` / \`NO_OP\` и логика из основного system prompt.
**Плюс** \`SET_ITEM_STOCK\` / \`PROPOSE_REPLACEMENT_FROM_WA\` — по основному system prompt.
В ленте наши исходящие **фото** опроса видны как [медиа …: url] (или в пометке к исходящим с позициями). Если поставщик просит картинки / не видит товар — в JSON добавь команду type **RESEND_PRODUCT_IMAGES** (реальная повторная отправка фото), плюс при необходимости короткий SEND_SUPPLIER_MESSAGE.
Текстом одними **нельзя** «выслать фото» — только RESEND_PRODUCT_IMAGES. На новое осмысленное входящее: STOCK/REPLACEMENT/SEND, без «а вы кто?». NO_OP — дубликат, оффтоп, или нечего добавить без спама после OUT_QUESTION.`;
}

const WEBHOOK_TRIGGER_RULE = `
**Триггер: мгновенный ответ на только что пришедшее сообщение поставщика (webhook).**
**Пошаговый ответ поставщика:** если в этой реплике он подтвердил/отклонил **только часть** позиций (одна «эта есть», «этих нет» и т.д.) — **нельзя** в ответ \`SEND\` с **напоминанием** про **остальные / ещё не отмеченные** позиции, «ждём отметку по наличию **по остальным**…», **в тот же момент**. Поставщик **продолжит** писать; **не** спамь. **Ты** решаешь: обычно \`SET_ITEM_STOCK\` по **уже** сказанному, \`ASK_REPLACEMENT\` / \`RESEND\` по смыслу, **короткий** нейтральный ответ **без** остатка, или \`NO_OP\`; **напоминание** про ещё не закрытые позиции — **только** при фоновом (cron) триггере и **не** раньше паузы из user (см. \`сейчас_utc\` и \`последний_OUT_AI\`).
**Запрещено (на webhook сам реши по ленте и user про время):** \`SEND\` с **смыслом** «срочно уточните/ждём **остальные** (ещё не закрытые) позиции / отметьте **по остатку** списка» — пока поставщик **только** начал отвечать пакетно; **такой** смысл оставь **следующему** проходу (фон) после паузы, см. \`сейчас_utc\` / \`последний_OUT_AI\` / \`интервал_мин\` в user.
**Исключение (разрешено и при отсутствии нужно):** уточнение **замены по одной** позиции, о которой **только что** «нет / не осталось» — **не** «остальные пункты заказа»; оформляй **только** \`ASK_REPLACEMENT_FOR_ITEM\` для **этой** \`order_item_id\` (+ \`SET_ITEM_STOCK\` / \`PROPOSE_REPLACEMENT_FROM_WA\` по смыслу), **без** длинного \`SEND\`. Реагируй на **последнее** входящее: SET_ITEM_STOCK, ASK_REPLACEMENT, RESEND, NO_OP.`;

const SCHEDULED_TRIGGER_RULE = `
**Триггер: фон (cron; до вызова уже ждали тишины от поставщика, см. \`isEligible\`).** Сверь \`сейчас_utc\`, \`последний_OUT_AI\`, \`пауза_между…\` в user: не дублируй бессмысленно длинные \`SEND\`; для «ещё не закрытых» позиций **без** перечня в одном сообщении — **только** \`ASK_STOCK_CHECK_FOR_ITEM\` по **одной** \`order_item_id\` за команду, сколько нужно подряд. Замена при отсутствии — \`ASK_REPLACEMENT_FOR_ITEM\` по **одной** позиции за раз (без \`SEND\`-списка).`;

/**
 * Returns whether outbound to supplier occurred (SEND or RESEND).
 */
export async function runSupplierPollGptForChat(params: {
  run: SupplierPollRunForGpt;
  chatId: string;
  trigger: 'webhook' | 'scheduled';
}): Promise<{ gptNoOp: boolean; sentWaOutbound: boolean }> {
  const { run, chatId, trigger } = params;
  const anchorTs = await anchorTimestampForChat(run.id, chatId);
  if (anchorTs == null) {
    return { gptNoOp: true, sentWaOutbound: false };
  }

  const linkByWa = new Map(run.waMessages.map(l => [l.waMessageId, l]));

  const thread = await prisma.waAdminMessage.findMany({
    where: {
      chatId,
      timestamp: { gte: anchorTs },
    },
    orderBy: [{ timestamp: 'asc' }, { waMessageId: 'asc' }],
  });

  const orderItemIds = new Set<string>();
  for (const l of run.waMessages) {
    if (l.orderItemId) orderItemIds.add(l.orderItemId);
    for (const id of parseOrderItemIdsJson(l.orderItemIdsJson)) {
      orderItemIds.add(id);
    }
  }

  const orderItems = await prisma.orderItem.findMany({
    where: {
      id: { in: [...orderItemIds] },
      orderId: run.orderId,
    },
    include: {
      product: { select: { name: true, article: true } },
    },
  });

  const catalogLines = orderItems.map(oi => {
    const st =
      oi.isAvailable === null ? 'null' : oi.isAvailable ? 'true' : 'false';
    return `- order_item_id=${oi.id}; name=${oi.product.name}; article=${oi.article ?? '—'}; qty=${oi.qty}; isAvailable_в_базе=${st} (null=ещё не уточняли в опросе)`;
  });

  const mapLines: string[] = [
    'Таблица: наши исходящие waMessageId из этого опроса и связанные позиции (к какому товару относилось исходящее):',
  ];
  for (const l of run.waMessages) {
    if (l.orderItemId) {
      mapLines.push(
        `- waMessageId=${l.waMessageId}; kind=${l.kind} → order_item_id=${l.orderItemId}`
      );
    } else {
      const ids = parseOrderItemIdsJson(l.orderItemIdsJson);
      mapLines.push(
        `- waMessageId=${l.waMessageId}; kind=${l.kind} → order_item_ids=${JSON.stringify(ids)}`
      );
    }
  }
  mapLines.push(
    'Если поставщик ответил без reply, сопоставь ответ с позициями по смыслу, этой таблице и ленте ниже. Подсказка ↩ в ленте по цитате — вспомогательная, её может не быть.'
  );

  const threadLines: string[] = [];
  for (const m of thread) {
    const link = linkByWa.get(m.waMessageId);
    const body =
      (m.textMessage && m.textMessage.trim()) ||
      (m.caption && m.caption.trim()) ||
      '';
    const media =
      m.mediaS3Url && m.typeMessage
        ? ` [медиа ${m.typeMessage}: ${m.mediaS3Url}]`
        : '';

    if (m.isFromMe && link) {
      const kind = link.kind;
      const oi = link.orderItemId
        ? `order_item_id=${link.orderItemId}`
        : `order_item_ids=${JSON.stringify(parseOrderItemIdsJson(link.orderItemIdsJson))}`;
      threadLines.push(
        `[МЫ] [${kind}] [${oi}] waMessageId=${m.waMessageId} ${body}${media}`
      );
    } else if (m.isFromMe) {
      threadLines.push(
        `[МЫ] (прочее) waMessageId=${m.waMessageId} ${body}${media}`
      );
    } else {
      const quoted = extractQuotedTargetMessageId(m.rawPayload);
      let hint = 'цитата не указана';
      if (quoted) {
        const ql = linkByWa.get(quoted);
        if (ql) {
          if (ql.orderItemId) {
            hint = `ответ на наше сообщение waMessageId=${quoted} → order_item_id=${ql.orderItemId} (${ql.kind})`;
          } else {
            hint = `ответ на общий вопрос waMessageId=${quoted} → позиции ${JSON.stringify(parseOrderItemIdsJson(ql.orderItemIdsJson))}`;
          }
        } else {
          hint = `ответ на waMessageId=${quoted} (не из меток опроса)`;
        }
      }
      threadLines.push(
        `[ПОСТАВЩИК] waMessageId=${m.waMessageId} ↩ ${hint}\n${body}${media}`
      );
    }
  }

  const systemExtra = `${baseSystemExtra(run)}
${trigger === 'webhook' ? WEBHOOK_TRIGGER_RULE : SCHEDULED_TRIGGER_RULE}`;

  const now = new Date();
  const lastOutAi = await getLastOutAiForPollRunChat(run.id, chatId);
  const gapMins = Math.round(supplierPollScheduledGapMs() / 60_000);
  const timeBlock = `Служебно для оценки пауз (UTC) — **решение только твоё**; **никакой** сервер не отбрасывает \`SEND\`:
- сейчас_utc=${now.toISOString()}
- пауза_между_смыслово_аналогичными_напоминаниями_про_ещё_не_закрытые_позиции_в_этом_опросе_мин ≈ **${gapMins}** (сравни с \`последний_OUT_AI.время\` и **лентой**; \`SEND\` с **другой** целью — замена, благодарность, уточнение по одной фразе поставщика — допустим, если не спам)
- последний_OUT_AI=${lastOutAi == null ? 'null' : JSON.stringify({ time_iso: lastOutAi.at.toISOString(), text_start: lastOutAi.textStart })}

`;
  const userPayload = `Справочник позиций заказа:\n${catalogLines.join(
    '\n'
  )}\n\n${mapLines.join(
    '\n'
  )}\n\n${timeBlock}Лента сообщений (хронологически, от якоря опроса в этом чате):\n${threadLines.join(
    '\n'
  )}`;

  const gpt = await runSupplierPollGpt({
    systemExtra,
    userPayload,
  });

  if (!gpt) {
    logger.debug('[supplier-poll] GPT skipped (no client or error)');
    return { gptNoOp: true, sentWaOutbound: false };
  }

  if (gpt.outcome === 'NO_OP') {
    return { gptNoOp: true, sentWaOutbound: false };
  }

  let toRun = gpt.commands;
  if (trigger === 'webhook') {
    const n = toRun.length;
    toRun = filterWebhookNoImmediateFollowup(toRun);
    if (toRun.length < n) {
      logger.info(
        `[supplier-poll] webhook: dropped ${n - toRun.length} follow-up (SEND / ASK_STOCK_CHECK), chat=${chatId} run=${run.id}`
      );
    }
  }
  if (toRun.length === 0) {
    return { gptNoOp: true, sentWaOutbound: false };
  }

  await executeSupplierPollCommands({
    pollRunId: run.id,
    orderId: run.orderId,
    chatId,
    adminUserId: run.createdByUserId,
    commands: toRun,
  });

  const sentWaOutbound = pollCommandsSendToSupplier(toRun);
  return { gptNoOp: false, sentWaOutbound };
}
