import pino from 'pino';

function resolveLevel(): string {
  const fromEnv = process.env.LOG_LEVEL?.trim();
  if (fromEnv) return fromEnv;
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

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
