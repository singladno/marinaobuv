import Groq from 'groq-sdk';
import { withRetry, type RetryOptions } from '@/utils/retry';

/**
 * Groq API Error Types
 */
export interface GroqAPIError {
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
  status?: number;
  statusCode?: number;
}

/**
 * Check if error is a Groq API error that should be retried
 */
export function isGroqRetryableError(error: unknown): boolean {
  if (!error) return false;

  const groqError = error as GroqAPIError;
  const status = groqError.status || groqError.statusCode;
  const message =
    groqError.error?.message?.toLowerCase() || String(error).toLowerCase();

  // Retry on 503 (over capacity) - Groq explicitly says to back off exponentially
  if (status === 503) return true;

  // Retry on 429 (rate limit)
  if (status === 429) return true;

  // Retry on 5xx server errors
  if (status && status >= 500 && status < 600) return true;

  // Check for specific Groq error messages
  if (message.includes('over capacity')) return true;
  if (message.includes('rate limit')) return true;
  if (message.includes('back off')) return true;
  if (message.includes('internal_server_error')) return true;
  // "context deadline exceeded" is a transient server timeout - should retry
  if (message.includes('context deadline exceeded')) return true;
  if (message.includes('deadline exceeded')) return true;
  if (message.includes('timeout')) return true;

  // Don't retry on client errors (4xx except 429 and timeout errors)
  if (status && status >= 400 && status < 500 && status !== 429) {
    // But allow retries for timeout-related 400 errors
    if (message.includes('context deadline exceeded') || message.includes('deadline exceeded') || message.includes('timeout')) {
      return true;
    }
    return false;
  }

  return false;
}

/**
 * Execute Groq API call with retry and circuit breaker
 */
export async function executeGroqCall<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  operationId: string = 'groq-api',
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    timeoutMs?: number;
  } = {}
): Promise<T> {
  const {
    maxRetries = 5, // More retries for Groq API
    baseDelayMs = 2000, // Start with 2 seconds for 503 errors
    maxDelayMs = 60000, // Max 60 seconds delay
    timeoutMs = 120000, // 2 minute timeout
  } = options;

  const retryOptions: RetryOptions = {
    maxRetries,
    baseDelayMs,
    maxDelayMs,
    timeoutMs,
    shouldRetry: error => {
      // Check if it's a Groq-specific retryable error
      if (isGroqRetryableError(error)) {
        const groqError = error as GroqAPIError;
        const message =
          groqError.error?.message?.toLowerCase() ||
          String(error).toLowerCase();

        // Log specific error types
        if (message.includes('over capacity')) {
          console.warn(
            `⚠️ Groq API over capacity - will retry with exponential backoff`
          );
        } else if (message.includes('rate limit')) {
          console.warn(`⚠️ Groq API rate limit - will retry with backoff`);
        } else if (message.includes('context deadline exceeded') || message.includes('deadline exceeded')) {
          console.warn(
            `⚠️ Groq API context deadline exceeded (server timeout) - will retry with exponential backoff`
          );
        }

        return true;
      }

      // Also check for network errors
      if (error instanceof Error) {
        const errorName = error.name?.toLowerCase() || '';
        const errorMessage = error.message?.toLowerCase() || '';

        if (
          errorName === 'aborterror' ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('network') ||
          errorMessage.includes('econnreset') ||
          errorMessage.includes('enotfound')
        ) {
          return true;
        }
      }

      return false;
    },
  };

  return withRetry(async signal => {
    // Check if aborted
    if (signal.aborted) {
      throw new Error('Operation aborted');
    }

    // Execute the Groq API call
    const result = await operation(signal);
    return result;
  }, retryOptions);
}

/**
 * Wrapper for Groq chat.completions.create with retry logic
 */
export async function groqChatCompletion(
  groq: Groq,
  params: Parameters<Groq['chat']['completions']['create']>[0],
  operationId: string = 'chat-completion',
  options?: {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    timeoutMs?: number;
  }
): Promise<Awaited<ReturnType<Groq['chat']['completions']['create']>>> {
  return executeGroqCall(
    async signal => {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timeout = setTimeout(
          () => reject(new Error('Groq API timeout')),
          options?.timeoutMs || 120000
        );
        signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new Error('Operation aborted'));
        });
      });

      // Execute Groq API call
      const groqPromise = groq.chat.completions.create(params as any);

      // Race between Groq call and timeout
      return Promise.race([groqPromise, timeoutPromise]);
    },
    operationId,
    options
  );
}
