// Rate limiting (simple in-memory token bucket)
const rateLimitMap = new Map<string, { tokens: number; lastRefill: number }>();
const RATE_LIMIT_TOKENS = 10;
const RATE_LIMIT_WINDOW = 60000; // 1 minute

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip) || { tokens: RATE_LIMIT_TOKENS, lastRefill: now };

  // Refill tokens
  const timePassed = now - userLimit.lastRefill;
  const tokensToAdd = Math.floor(timePassed / (RATE_LIMIT_WINDOW / RATE_LIMIT_TOKENS));
  userLimit.tokens = Math.min(RATE_LIMIT_TOKENS, userLimit.tokens + tokensToAdd);
  userLimit.lastRefill = now;

  if (userLimit.tokens <= 0) {
    return false;
  }

  userLimit.tokens--;
  rateLimitMap.set(ip, userLimit);
  return true;
}
