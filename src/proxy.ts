import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Only initialise Redis when env vars are present — keeps dev/test working without them
function getRateLimiters() {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const redis = new Redis({ url, token });
  return {
    // OTP / auth: 5 attempts per 10 min per IP
    otp: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "10 m"), prefix: "rl:otp" }),
    // Order creation: 10 per min per IP (prevent cart flooding)
    orders: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 m"), prefix: "rl:orders" }),
    // General API: 60 requests per min per IP
    api: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, "1 m"), prefix: "rl:api" }),
  };
}

const limiters = getRateLimiters();

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous"
  );
}

function rateLimitResponse(retryAfter?: number) {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: retryAfter ? { "Retry-After": String(retryAfter) } : {},
    }
  );
}

const FAIL_OPEN = { success: true, reset: 0 };

/* Safely call a rate limiter with a hard 300 ms timeout.
   DNS failures take ~4 s to throw — the race ensures we fail open
   in ≤300 ms instead of blocking every request for seconds. */
async function limit(fn: () => Promise<{ success: boolean; reset?: number }>) {
  try {
    return await Promise.race([
      fn(),
      new Promise<typeof FAIL_OPEN>(resolve =>
        setTimeout(() => resolve(FAIL_OPEN), 300)
      ),
    ]);
  } catch {
    return FAIL_OPEN;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip if Redis not configured (dev / missing env vars)
  if (!limiters) return NextResponse.next();

  const ip = getIp(req);

  // ── OTP endpoints ─────────────────────────────────────────────────────────
  if (
    pathname === "/api/auth/sign-in/phone-number" ||
    pathname === "/api/auth/email-otp/send-verification-otp"
  ) {
    const { success, reset } = await limit(() => limiters!.otp.limit(ip));
    if (!success) return rateLimitResponse(reset ? Math.ceil((reset - Date.now()) / 1000) : undefined);
  }

  // ── Order creation ─────────────────────────────────────────────────────────
  if (pathname === "/api/orders" && req.method === "POST") {
    const { success } = await limit(() => limiters!.orders.limit(ip));
    if (!success) return rateLimitResponse();
  }

  // ── Coupon brute-force protection ──────────────────────────────────────────
  if (pathname === "/api/coupons/validate" && req.method === "POST") {
    const { success } = await limit(() => limiters!.otp.limit(`coupon:${ip}`));
    if (!success) return rateLimitResponse();
  }

  // ── General API rate limit ─────────────────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    const { success } = await limit(() => limiters!.api.limit(ip));
    if (!success) return rateLimitResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // All API routes
    "/api/:path*",
  ],
};
