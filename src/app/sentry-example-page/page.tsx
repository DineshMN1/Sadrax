"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

export default function SentryExamplePage() {
  const [sent, setSent] = useState<string>("");

  const throwClientError = () => {
    // Uncaught error → captured by Sentry's global handler
    throw new Error("Sentry client test error from Sadrax 🚨");
  };

  const captureManually = () => {
    Sentry.captureException(new Error("Sentry manual test from Sadrax"));
    setSent("Sent a manual exception. Check Sentry → Issues.");
  };

  const triggerServerError = async () => {
    await fetch("/api/sentry-test").catch(() => {});
    setSent("Triggered a server error. Check Sentry → Issues.");
  };

  return (
    <main style={{ maxWidth: 480, margin: "60px auto", padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Sentry test</h1>
      <p style={{ color: "#666", marginTop: 8 }}>
        Click a button, then look in your Sentry project under <b>Issues</b>.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
        <button onClick={throwClientError} style={btn("#ef4444")}>Throw client error</button>
        <button onClick={captureManually} style={btn("#6366f1")}>Capture exception (manual)</button>
        <button onClick={triggerServerError} style={btn("#111827")}>Trigger server error</button>
      </div>
      {sent && <p style={{ marginTop: 16, color: "#16a34a", fontWeight: 600 }}>{sent}</p>}
    </main>
  );
}

const btn = (bg: string): React.CSSProperties => ({
  background: bg, color: "white", border: "none", borderRadius: 12,
  padding: "12px 16px", fontWeight: 700, cursor: "pointer", fontSize: 14,
});
