"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key  = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";

    if (!key || process.env.NODE_ENV !== "production") return;

    posthog.init(key, {
      api_host:               host,
      capture_pageview:       false, // handled manually via usePathname
      capture_pageleave:      true,
      session_recording: {
        maskAllInputs:    false,
        maskInputOptions: { password: true },
      },
      persistence: "localStorage",
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
