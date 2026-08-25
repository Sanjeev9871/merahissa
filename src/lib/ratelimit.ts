/**
 * Rate limiting.
 *
 * Two backends behind one interface:
 *   - Upstash Redis when configured (correct across serverless instances)
 *   - An in-process fallback otherwise (correct in dev, best-effort in prod)
 *
 * The fallback is deliberately honest about being a fallback: Vercel runs many
 * short-lived instances, so an in-memory counter is per-instance and an
 * attacker spreading requests across instances gets a multiple of the limit.
 * It is better than nothing for dev and for a single-instance deploy, and
 * `isDistributed` lets the health check surface the difference rather than
 * letting us believe we are protected when we are not.
 *
 * Limits are set by what the endpoint costs us and what it protects:
 *   auth      — brute force and SMS/email cost
 *   ai        — free-tier quota is the scarce resource
 *   upload    — storage quota and bandwidth
 *   payment   — order-creation abuse
 */

export type Bucket = 'auth' | 'ai' | 'upload' | 'payment' | 'general';

interface Limit { points: number; windowSeconds: number }

const LIMITS: Record<Bucket, Limit> = {
  auth: { points: 5, windowSeconds: 900 },       // 5 sign-in attempts / 15 min
  ai: { points: 20, windowSeconds: 3600 },       // 20 generations / hour / user
  upload: { points: 40, windowSeconds: 3600 },   // 40 files / hour
  payment: { points: 10, windowSeconds: 3600 },  // 10 order attempts / hour
  general: { points: 120, windowSeconds: 60 },
};

export interface RateResult {
  allowed: boolean;
  remaining: number;
  /** Unix ms when the window resets. Sent as Retry-After. */
  resetAt: number;
}

export function isDistributed(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

// --- in-process fallback ----------------------------------------------------

const memory = new Map<string, { count: number; resetAt: number }>();

function memoryLimit(key: string, limit: Limit): RateResult {
  const now = Date.now();
  const entry = memory.get(key);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + limit.windowSeconds * 1000;
    memory.set(key, { count: 1, resetAt });

    // Opportunistic sweep so a long-lived process does not grow unbounded.
    if (memory.size > 10_000) {
      for (const [k, v] of memory) if (v.resetAt <= now) memory.delete(k);
    }

    return { allowed: true, remaining: limit.points - 1, resetAt };
  }

  entry.count += 1;
  return {
    allowed: entry.count <= limit.points,
    remaining: Math.max(0, limit.points - entry.count),
    resetAt: entry.resetAt,
  };
}

// --- Upstash ----------------------------------------------------------------

/**
 * INCR then EXPIRE on first hit — a fixed window, not a sliding one. Fixed
 * windows allow a burst at a boundary (up to 2x the limit across two adjacent
 * windows). For abuse prevention at this scale that is an acceptable trade
 * against the extra round trips a sliding window costs.
 */
async function upstashLimit(key: string, limit: Limit): Promise<RateResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;

  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify([
      ['INCR', key],
      ['EXPIRE', key, String(limit.windowSeconds), 'NX'],
      ['TTL', key],
    ]),
  });

  if (!res.ok) throw new Error(`Upstash returned ${res.status}`);

  const out = (await res.json()) as Array<{ result: number }>;
  const count = out[0]?.result ?? 1;
  const ttl = out[2]?.result ?? limit.windowSeconds;

  return {
    allowed: count <= limit.points,
    remaining: Math.max(0, limit.points - count),
    resetAt: Date.now() + Math.max(ttl, 0) * 1000,
  };
}

// --- public -----------------------------------------------------------------

/**
 * `identifier` should be a user id where one exists, and a hashed IP
 * otherwise. Never a raw IP: this key can end up in Redis, in logs, and in
 * error reports, and we have no use for the address itself.
 */
export async function rateLimit(bucket: Bucket, identifier: string): Promise<RateResult> {
  const limit = LIMITS[bucket];
  const key = `rl:${bucket}:${identifier}`;

  if (!isDistributed()) return memoryLimit(key, limit);

  try {
    return await upstashLimit(key, limit);
  } catch {
    // Redis being down must not take the site down. Fall back to the
    // in-process counter, which still blunts a single-instance flood.
    return memoryLimit(key, limit);
  }
}

/** Standard headers so clients can back off politely. */
export function rateLimitHeaders(r: RateResult): Record<string, string> {
  const headers: Record<string, string> = {
    'x-ratelimit-remaining': String(r.remaining),
    'x-ratelimit-reset': String(Math.ceil(r.resetAt / 1000)),
  };
  if (!r.allowed) {
    headers['retry-after'] = String(Math.max(1, Math.ceil((r.resetAt - Date.now()) / 1000)));
  }
  return headers;
}

/** Exposed for tests and the admin health panel. */
export function limitsFor(bucket: Bucket): Limit {
  return LIMITS[bucket];
}

/** Test seam. Never call from application code. */
export function __resetMemoryLimiter(): void {
  memory.clear();
}
