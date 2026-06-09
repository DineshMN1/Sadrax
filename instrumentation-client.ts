// Client-side instrumentation (Next 15.3+): Sentry + PostHog, initialized once
// before the React tree.
import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";

// ── Sentry (browser) ──────────────────────────────────────────────
const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
Sentry.init({
  dsn: sentryDsn,
  environment: process.env.NODE_ENV,
  enabled: !!sentryDsn, // report whenever a DSN is set (dev + prod)
  tracesSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [
    Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
  ],
});

// Instrument App Router navigations for Sentry
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

// ── PostHog (browser) ─────────────────────────────────────────────
const phToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || process.env.NEXT_PUBLIC_POSTHOG_KEY;
if (phToken) {
  posthog.init(phToken, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    capture_pageview: "history_change", // auto-captures SPA navigations
    capture_pageleave: true,
    persistence: "localStorage",
    secure_cookie: true,
    cross_subdomain_cookie: false,
    session_recording: {
      maskAllInputs: false,
      maskInputOptions: { password: true },
    },
  });
}
