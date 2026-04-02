import type { Logger } from 'pino';

import { logger } from '@/lib/server/logger';

const REQUEST_ID_HEADER = 'x-request-id';

export function getRequestIdFromRequest(request: Request): string | undefined {
  return request.headers.get(REQUEST_ID_HEADER) ?? undefined;
}

/** Prefer this in Route Handlers so Pino lines include `requestId` for Nginx/app correlation. */
export function getRequestLogger(request: Request): Logger {
  const requestId = getRequestIdFromRequest(request);
  return requestId ? logger.child({ requestId }) : logger;
}

/**
 * Use in `catch` blocks of App Router handlers when `request` is in scope.
 * Do not use in Edge Middleware (use `console.error` there — Pino is Node-only).
 */
export function logRequestError(
  request: Request,
  route: string,
  err: unknown,
  msg = 'request_error'
): void {
  getRequestLogger(request).error({ err, route }, msg);
}
