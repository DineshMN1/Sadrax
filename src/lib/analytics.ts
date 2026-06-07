"use client";

import posthog from "posthog-js";

// Safe wrapper around PostHog capture — no-ops if PostHog isn't initialized
// (e.g. no token set). Use for named product events that power funnels,
// growth accounting and revenue insights.
export function track(event: string, props?: Record<string, unknown>): void {
  try {
    posthog.capture(event, props);
  } catch {
    /* ignore — analytics must never break the app */
  }
}
