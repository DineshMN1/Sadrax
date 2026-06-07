"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { authClient } from "@/lib/auth-client";

// Ties PostHog events to the logged-in user so funnels, retention and growth
// accounting work per-person. Uses getSession() in an effect (client-only) to
// avoid the SSR issues the useSession hook has here.
export function PostHogIdentify() {
  useEffect(() => {
    let active = true;
    authClient.getSession()
      .then((res) => {
        if (!active) return;
        const user = (res?.data as { user?: { id: string; email?: string; name?: string } } | null)?.user;
        if (user?.id) {
          posthog.identify(user.id, { email: user.email, name: user.name });
        }
      })
      .catch(() => { /* ignore */ });
    return () => { active = false; };
  }, []);

  return null;
}
