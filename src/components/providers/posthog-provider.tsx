"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

// PostHog is initialized in instrumentation-client.ts. This provider only
// exposes the singleton to React (so usePostHog() works in components).
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return <PHProvider client={posthog}>{children}</PHProvider>;
}
