import pino from 'pino';

function resolveLevel(): string {
  const fromEnv = process.env.LOG_LEVEL?.trim();
  if (fromEnv) return fromEnv;
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

/** Pretty printing only when not in production and LOG_PRETTY=1; production is always JSON. */
const usePretty =
  process.env.NODE_ENV !== 'production' && process.env.LOG_PRETTY === '1';

/** JSON logs to stdout — consumed by PM2 and shipped by Yandex Unified Agent. */
export const logger = pino({
  level: resolveLevel(),
  ...(usePretty
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' },
        },
      }
    : {}),
});

/** Pino typings reject `logger.error(msg, err)`; use this for caught errors. */
export function logServerError(message: string, err: unknown): void {
  logger.error({ err }, message);
}

/** Multi-arg debug — Pino expects a single object or string message. */
export function logDebug(message: string, ...detail: unknown[]): void {
  if (detail.length === 0) logger.debug(message);
  else
    logger.debug(
      { detail: detail.length === 1 ? detail[0] : detail },
      message
    );
}

export function logWarn(message: string, ...detail: unknown[]): void {
  if (detail.length === 0) logger.warn(message);
  else
    logger.warn(
      { detail: detail.length === 1 ? detail[0] : detail },
      message
    );
}

export function logInfo(message: string, ...detail: unknown[]): void {
  if (detail.length === 0) logger.info(message);
  else
    logger.info(
      { detail: detail.length === 1 ? detail[0] : detail },
      message
    );
}

/** Multi-arg error line (not for caught `Error` — use `logServerError` for those). */
export function logError(message: string, ...detail: unknown[]): void {
  if (detail.length === 0) logger.error(message);
  else
    logger.error(
      { detail: detail.length === 1 ? detail[0] : detail },
      message
    );
}
