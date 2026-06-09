// Server/edge instrumentation: loads the Sentry config for the active runtime
// and forwards Next.js request errors to Sentry.
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Node 20+ races IPv6/IPv4 (Happy Eyeballs) with a 250ms per-attempt
    // timeout. On networks with no IPv6 route and high latency to the DB region
    // (Neon eu-west-2 / London), the IPv4 handshake can exceed 250ms and Node
    // aborts it as ETIMEDOUT — surfacing as "fetch failed" on every query.
    // Give the connection attempt a realistic budget so queries connect.
    const net = await import("node:net");
    net.setDefaultAutoSelectFamilyAttemptTimeout(3000);

    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
