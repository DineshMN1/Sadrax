import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";
import { withSentryConfig } from "@sentry/nextjs";

// Allow the MinIO host that serves uploaded images (derived from MINIO_PUBLIC_URL,
// e.g. http://localhost:9000/sadrax in dev or https://cdn.example.com in prod).
function minioRemotePattern(): RemotePattern | null {
  const url = process.env.MINIO_PUBLIC_URL;
  if (!url) return null;
  try {
    const { protocol, hostname, port } = new URL(url);
    return {
      protocol: protocol.replace(":", "") as "http" | "https",
      hostname,
      ...(port ? { port } : {}),
    };
  } catch {
    return null;
  }
}

// Origin (scheme://host[:port]) that serves uploaded images, for the CSP.
function minioOrigin(): string | null {
  const url = process.env.MINIO_PUBLIC_URL;
  if (!url) return null;
  try { return new URL(url).origin; } catch { return null; }
}

// ── Security headers (graded by securityheaders.com et al.) ──────────────────
const isDev = process.env.NODE_ENV === "development";

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  // Next.js injects inline bootstrap scripts without a nonce in a static-header
  // setup, so 'unsafe-inline' is required here. 'unsafe-eval' is dev-only (React
  // debug). For a strict, nonce-based policy, move CSP into proxy.ts.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://us-assets.i.posthog.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  // Broad https for images: product images (MinIO), OSM map tiles + Leaflet
  // marker icons, PostHog assets — all https, none should be able to break.
  "img-src 'self' data: blob: https:",
  [
    "connect-src 'self'",
    "https://us.i.posthog.com",
    "https://us-assets.i.posthog.com",
    "https://*.ingest.sentry.io",
    "https://nominatim.openstreetmap.org",
    minioOrigin(),
  ].filter(Boolean).join(" "),
  "worker-src 'self' blob:",
  "media-src 'self'",
  "manifest-src 'self'",
  // Skip in dev — the local app runs over http://localhost.
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // geolocation=(self): checkout GPS pin + rider live location use it.
    value: "geolocation=(self), camera=(), microphone=(), payment=(), usb=(), bluetooth=(), magnetometer=(), accelerometer=(), gyroscope=(), browsing-topics=()",
  },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-auth", "@better-auth/kysely-adapter", "sharp"],
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  images: {
    remotePatterns: [minioRemotePattern()].filter(
      (p): p is RemotePattern => p !== null
    ),
  },
  experimental: {
    serverActions: {
      allowedOrigins: (() => {
        const origins = ["localhost:3000"];
        try {
          const { host } = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "");
          if (host && !origins.includes(host)) origins.push(host);
        } catch {}
        return origins;
      })(),
    },
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: false,
  sourcemaps: { disable: true },
});
