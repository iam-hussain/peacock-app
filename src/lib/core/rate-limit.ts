/**
 * In-memory rate limiter for API routes.
 * Uses a sliding window counter per key (IP or user).
 */

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically (every 5 minutes)
setInterval(
  () => {
    const now = Date.now();
    store.forEach((entry, key) => {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    });
  },
  5 * 60 * 1000
);

type RateLimitConfig = {
  /** Max number of requests allowed in the window */
  maxRequests: number;
  /** Window size in seconds */
  windowSeconds: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

/**
 * Check if a request is allowed under the rate limit.
 * @param key Unique key for the rate limit (e.g., `login:${ip}`)
 * @param config Rate limit configuration
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    // First request or window expired — start new window
    const resetAt = now + config.windowSeconds * 1000;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/** Pre-configured rate limits */
export const RATE_LIMITS = {
  /** Login: 5 attempts per 15 minutes */
  login: { maxRequests: 5, windowSeconds: 15 * 60 } as RateLimitConfig,
  /** General API: 100 requests per minute */
  api: { maxRequests: 100, windowSeconds: 60 } as RateLimitConfig,
  /** Heavy operations (recalculate, backup): 2 per 10 minutes */
  heavy: { maxRequests: 2, windowSeconds: 10 * 60 } as RateLimitConfig,
} as const;

/**
 * Extract client IP from request headers (works behind proxies)
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "unknown";
}

/**
 * Helper that returns a 429 Response if rate limited, or null if allowed.
 */
export function rateLimitResponse(
  request: Request,
  prefix: string,
  config: RateLimitConfig
): Response | null {
  const ip = getClientIp(request);
  const result = checkRateLimit(`${prefix}:${ip}`, config);

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.resetAt),
        },
      }
    );
  }

  return null;
}
