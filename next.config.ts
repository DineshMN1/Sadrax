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

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-auth", "@better-auth/kysely-adapter", "sharp"],
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
