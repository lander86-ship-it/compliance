// Lightweight in-memory rate limiter for brute-force protection on auth endpoints.
// Best-effort: state lives in the process (single Railway instance), reset on redeploy.
// Not a substitute for a WAF, but stops naive credential-stuffing against login/signup.

type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

// Periodically drop expired buckets so the map can't grow without bound.
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, b] of store) if (b.resetAt <= now) store.delete(k);
}

export type RateResult = { ok: boolean; remaining: number; retryAfter: number };

// Fixed-window limiter. `limit` requests per `windowMs`, keyed by an arbitrary string.
export function rateLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now();
  sweep(now);
  const b = store.get(key);
  if (!b || b.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }
  if (b.count >= limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { ok: true, remaining: limit - b.count, retryAfter: 0 };
}

// Best-effort client IP from proxy headers (Railway sets x-forwarded-for).
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
