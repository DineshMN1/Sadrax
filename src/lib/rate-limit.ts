// Lightweight in-memory rate limiter (per server instance). Good enough for a
// single-container deployment to stop spam/abuse on sensitive endpoints.
// For multi-instance scale, swap the Map for Redis.

interface Bucket { count: number; resetAt: number }
const buckets = new Map<string, Bucket>();

// Occasionally sweep expired buckets so the Map doesn't grow unbounded.
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
}

export function clientKey(req: Request, scope: string): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = (fwd ? fwd.split(",")[0] : req.headers.get("x-real-ip")) ?? "unknown";
  return `${scope}:${ip.trim()}`;
}

/**
 * Returns { ok, retryAfter }. Allows `limit` requests per `windowMs`.
 */
export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  sweep(now);
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (b.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count++;
  return { ok: true, retryAfter: 0 };
}

// Convenience: enforce a limit for a request scope; returns a 429 Response or null.
export function checkRateLimit(req: Request, scope: string, limit: number, windowMs: number): Response | null {
  const { ok, retryAfter } = rateLimit(clientKey(req, scope), limit, windowMs);
  if (ok) return null;
  return new Response(
    JSON.stringify({ error: `Too many requests. Try again in ${retryAfter}s.` }),
    { status: 429, headers: { "Content-Type": "application/json", "Retry-After": String(retryAfter) } }
  );
}
