import type { Prisma } from '@prisma/client';

import { isOldPortalXmlImportEnabled } from '@/lib/env';
import { prisma } from '@/lib/server/db';
import { logInfo, logServerError, logWarn } from '@/lib/server/logger';

import { interpretMoAjaxResponseBody } from '@/lib/services/old-portal-mo-ajax-response';

const ADVISORY_LOCK_KEY = 918_273_645;

const DEFAULT_PORTAL_URL = 'https://ap.sferait.ru/app/marinaobuv/';

function getPortalUrl(): string {
  const u = process.env.OLD_PORTAL_XML_IMPORT_URL?.trim();
  if (u) return u;
  return DEFAULT_PORTAL_URL;
}

/** POST target — same as the legacy page’s `$.ajax({ url: "mo_ajax.php" })`. */
function getMoAjaxEndpoint(): string {
  const base = getPortalUrl();
  const withSlash = base.endsWith('/') ? base : `${base}/`;
  return new URL('mo_ajax.php', withSlash).href;
}

function getImportTimeoutMs(): number {
  const raw = process.env.OLD_PORTAL_XML_IMPORT_TIMEOUT_MS?.trim();
  if (raw) {
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 60_000) return Math.floor(n);
  }
  return 45 * 60 * 1000;
}

function getStaleRunningMs(): number {
  const raw = process.env.OLD_PORTAL_XML_IMPORT_STALE_MS?.trim();
  if (raw) {
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 60_000) return Math.floor(n);
  }
  return 3 * 60 * 60 * 1000;
}

function truncateDetail(message: string, max = 8000): string {
  if (message.length <= max) return message;
  return `${message.slice(0, max)}…`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export class OldPortalImportBusyError extends Error {
  readonly running?: { xmlFilename: string; startedAt: string };

  constructor(running?: { xmlFilename: string; startedAt: Date }) {
    super('Old portal XML import is already running');
    this.name = 'OldPortalImportBusyError';
    if (running) {
      this.running = {
        xmlFilename: running.xmlFilename,
        startedAt: running.startedAt.toISOString(),
      };
    }
  }
}

async function resetStaleRunningImportsTx(
  tx: Prisma.TransactionClient,
  staleMs: number
): Promise<void> {
  const staleBefore = new Date(Date.now() - staleMs);
  await tx.oldPortalXmlImport.updateMany({
    where: {
      status: 'RUNNING',
      startedAt: { lt: staleBefore },
    },
    data: {
      status: 'FAILED',
      completedAt: new Date(),
      errorMessage:
        'Импорт помечен как прерванный: превышено время без завершения на сервере.',
    },
  });
}

/**
 * Begins a RUNNING row; only one import may run at a time (Postgres advisory lock + DB row).
 */
export async function beginOldPortalImportRun(params: {
  xmlFilename: string;
  s3Url: string;
  triggeredBy: string;
}): Promise<string> {
  const staleMs = getStaleRunningMs();

  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${ADVISORY_LOCK_KEY})`;

    await resetStaleRunningImportsTx(tx, staleMs);

    const running = await tx.oldPortalXmlImport.findFirst({
      where: { status: 'RUNNING' },
    });
    if (running) {
      throw new OldPortalImportBusyError(running);
    }

    const row = await tx.oldPortalXmlImport.create({
      data: {
        xmlFilename: params.xmlFilename,
        s3Url: params.s3Url,
        status: 'RUNNING',
        triggeredBy: params.triggeredBy,
      },
    });
    return row.id;
  });
}

async function postMoAjax(s3Url: string): Promise<void> {
  const endpoint = getMoAjaxEndpoint();
  const timeoutMs = getImportTimeoutMs();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    logInfo('Old portal: POST mo_ajax.php', { endpoint });
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: '*/*',
        'User-Agent':
          'Mozilla/5.0 (compatible; MarinaObuvOldPortalImport/1.0; +https://marina-obuv.ru)',
      },
      body: new URLSearchParams({ url: s3Url }).toString(),
      signal: controller.signal,
    });

    const text = await res.text();

    if (!res.ok) {
      throw new Error(
        `HTTP ${res.status}: ${truncateDetail(stripHtml(text).slice(0, 500))}`
      );
    }

    interpretMoAjaxResponseBody(text);
    logInfo('Old portal mo_ajax: success');
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error(
        `Таймаут HTTP (${Math.round(timeoutMs / 60000)} мин) при обращении к mo_ajax.php`
      );
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Runs HTTP import and marks the RUNNING row SUCCESS or FAILED.
 * @returns whether the import completed successfully on the legacy portal.
 */
export async function runOldPortalImportHttpAndComplete(
  runId: string,
  s3Url: string
): Promise<boolean> {
  try {
    await postMoAjax(s3Url);
    await prisma.oldPortalXmlImport.update({
      where: { id: runId },
      data: {
        status: 'SUCCESS',
        completedAt: new Date(),
        errorMessage: null,
      },
    });
    logInfo('Old portal XML import finished successfully', { runId });
    return true;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : truncateDetail(String(err));
    await prisma.oldPortalXmlImport.update({
      where: { id: runId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorMessage: truncateDetail(message),
      },
    });
    logServerError('Old portal XML import failed', err);
    return false;
  }
}

export type OldPortalQueueMode = 'await' | 'background';

export type QueueOldPortalXmlImportResult =
  | {
      ok: true;
      runId: string;
      /** Set when `mode` is `await` — whether HTTP run succeeded. */
      importSucceeded?: boolean;
    }
  | { ok: false; reason: 'disabled' }
  | {
      ok: false;
      reason: 'busy';
      running?: OldPortalImportBusyError['running'];
    };

/**
 * POSTs to legacy `mo_ajax.php` (same as the Bitrix page), no browser.
 */
export async function queueOldPortalXmlImport(params: {
  xmlFilename: string;
  s3Url: string;
  triggeredBy: string;
  mode: OldPortalQueueMode;
}): Promise<QueueOldPortalXmlImportResult> {
  if (!isOldPortalXmlImportEnabled()) {
    return { ok: false, reason: 'disabled' };
  }

  let runId: string;
  try {
    runId = await beginOldPortalImportRun({
      xmlFilename: params.xmlFilename,
      s3Url: params.s3Url,
      triggeredBy: params.triggeredBy,
    });
  } catch (e) {
    if (e instanceof OldPortalImportBusyError) {
      logWarn('Old portal XML import skipped — already running', e.running);
      return { ok: false, reason: 'busy', running: e.running };
    }
    throw e;
  }

  if (params.mode === 'await') {
    const importSucceeded = await runOldPortalImportHttpAndComplete(
      runId,
      params.s3Url
    );
    return { ok: true, runId, importSucceeded };
  }

  void runOldPortalImportHttpAndComplete(runId, params.s3Url);
  return { ok: true, runId };
}

/** Fire-and-forget after export; logs failures. */
export function queueOldPortalXmlImportBackgroundSafe(params: {
  xmlFilename: string;
  s3Url: string;
  triggeredBy: string;
}): void {
  void queueOldPortalXmlImport({ ...params, mode: 'background' }).then(
    result => {
      if (!result.ok && result.reason === 'busy') {
        logWarn('Old portal XML import not started (busy)', params);
      }
    },
    err => logServerError('queueOldPortalXmlImport failed', err)
  );
}
