// Lightweight retry utility with timeout and exponential backoff.
// Keeps logic centralized and removes per-call env-based delays.

export type RetryOptions = {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
  shouldRetry?: (error: unknown) => boolean;
};

export async function withRetry<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  {
    maxRetries = 6,
    baseDelayMs = 300,
    maxDelayMs = 10_000,
    timeoutMs = 60_000,
    shouldRetry = defaultShouldRetry,
  }: RetryOptions = {}
): Promise<T> {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await operation(controller.signal);
    } catch (error) {
      attempt += 1;
      if (attempt > maxRetries || !shouldRetry(error)) {
        throw error;
      }
      const jitter = 0.75 + Math.random() * 0.25; // 0.75–1.0
      const delay = Math.min(
        maxDelayMs,
        Math.ceil(baseDelayMs * 2 ** (attempt - 1) * jitter)
      );
      await sleep(delay);
    } finally {
      clearTimeout(timer);
    }
  }
}

export function defaultShouldRetry(error: any): boolean {
  const status = error?.status ?? error?.response?.status;
  const message: string | undefined = error?.message;
  // Network hiccups
  if (error?.name === 'AbortError') return true;
  // Rate limits and 5xx
  if (status === 429) return true;
  if (typeof status === 'number' && status >= 500 && status < 600) return true;
  if (typeof message === 'string' && message.includes('429')) return true;
  return false;
}

export async function sleep(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}
