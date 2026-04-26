#!/usr/bin/env tsx
/**
 * Every run (e.g. cron every 10 minutes): for IN_PROGRESS poll runs, eligible chats, call GPT
 * to optionally remind about items still without availability, after
 * SUPPLIER_POLL_SCHEDULED_GAP_MINUTES (default 10) since the last **supplier** inbound.
 *
 * Webhook path does not nudge for «other items»; this script does.
 * Disable: DISABLE_CRON_SUPPLIER_POLL_FOLLOWUP=true
 */
import './load-env';

import { logServerError, logger } from '@/lib/server/logger';
import { prisma } from '@/lib/server/db';
import {
  runSupplierPollGptForChat,
  supplierPollRunGptInclude,
} from '@/lib/supplier-poll/run-supplier-poll-gpt-for-chat';
import {
  getScheduledFollowupEligibility,
  markSchedulerFollowupSent,
} from '@/lib/supplier-poll/supplier-poll-chat-state';
import { pollRunHasPolledItemWithoutAvailability } from '@/lib/supplier-poll/supplier-poll-pending';
import { pollRunHasUnresolvedSupplierReplacementThreads } from '@/lib/supplier-poll/supplier-poll-replacement-gate';

function line(msg: string): void {
  if (process.env.SUPPLIER_POLL_SCHEDULED_LOG_QUIET === '1') return;
  console.log(`[supplier-poll-scheduled] ${msg}`);
}

async function main(): Promise<void> {
  if (process.env.DISABLE_CRON_SUPPLIER_POLL_FOLLOWUP === 'true') {
    console.log(
      '[supplier-poll-scheduled] disabled (DISABLE_CRON_SUPPLIER_POLL_FOLLOWUP=true)'
    );
    return;
  }

  const started = new Date();
  line(`старт ${started.toISOString()}`);

  const runs = await prisma.supplierPollRun.findMany({
    where: { status: 'IN_PROGRESS' },
    include: supplierPollRunGptInclude,
    orderBy: { updatedAt: 'desc' },
  });

  const now = new Date();
  let gptCalls = 0;
  let waOutbound = 0;

  line(
    `активных опросов (IN_PROGRESS): ${runs.length} — ${runs.length === 0 ? 'в БД нет открытых прогонов, обрабатывать нечего' : 'см. детали ниже'}`
  );

  for (const run of runs) {
    const pendingStock = await pollRunHasPolledItemWithoutAvailability(
      run.id,
      run.orderId
    );
    const openReplacement =
      await pollRunHasUnresolvedSupplierReplacementThreads(
        run.id,
        run.orderId,
        run.createdAt
      );

    const flags = [
      pendingStock ? 'ждём наличие по опрошенным позициям' : null,
      openReplacement ? 'открыты ветки замен' : null,
    ]
      .filter(Boolean)
      .join('; ');

    const chatIds = new Set<string>();
    for (const w of run.waMessages) {
      chatIds.add(w.chatId);
    }

    line(
      `— заказ orderId=${run.orderId} pollRunId=${run.id} чатов в прогоне: ${chatIds.size} | ${flags || 'нет открытой работы по наличию/заменам'}`
    );

    if (chatIds.size === 0) {
      line(
        `  (нет привязанных WA-сообщений к прогону — GPT по чату не вызывается)`
      );
      continue;
    }

    const needsWork = pendingStock || openReplacement;
    if (!needsWork) {
      for (const chatId of chatIds) {
        line(
          `  chat ${chatId}: пропуск — по этому прогону нечего напоминать (наличие и замены закрыты)`
        );
      }
      continue;
    }

    for (const chatId of chatIds) {
      const elig = await getScheduledFollowupEligibility(run.id, chatId, now);
      if (!elig.eligible) {
        line(`  chat ${chatId}: пропуск — ${elig.detail}`);
        continue;
      }

      line(
        `  chat ${chatId}: вызов GPT (scheduled) — есть работа (${pendingStock ? 'наличие' : ''}${pendingStock && openReplacement ? ' + ' : ''}${openReplacement ? 'замены' : ''})`
      );

      try {
        const { gptNoOp, sentWaOutbound } = await runSupplierPollGptForChat({
          run,
          chatId,
          trigger: 'scheduled',
        });
        gptCalls += 1;
        if (sentWaOutbound) {
          waOutbound += 1;
          await markSchedulerFollowupSent({
            pollRunId: run.id,
            chatId,
            at: new Date(),
          });
        }
        line(
          `  chat ${chatId}: результат — ${sentWaOutbound ? 'исходящее WA отправлено' : 'исходящее WA не отправлено'}, gptNoOp=${gptNoOp}`
        );
      } catch (e) {
        logServerError(
          `[supplier-poll-scheduled] run ${run.id} chat ${chatId} failed:`,
          e
        );
        line(`  chat ${chatId}: ошибка (см. logger.error)`);
      }
    }
  }

  line(
    `итого: прогонов IN_PROGRESS=${runs.length}, вызовов GPT=${gptCalls}, исходящих WA=${waOutbound}, завершено ${new Date().toISOString()}`
  );

  if (process.env.SUPPLIER_POLL_SCHEDULED_LOG_VERBOSE === '1') {
    logger.debug(
      {
        runs: runs.length,
        gptCalls,
        waOutbound,
      },
      '[supplier-poll-scheduled] verbose metrics'
    );
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(e => {
    logServerError('[supplier-poll-scheduled] fatal', e);
    void prisma.$disconnect();
    process.exit(1);
  });
