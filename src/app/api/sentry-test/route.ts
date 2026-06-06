import { NextResponse } from "next/server";

// Throws on purpose so Sentry's onRequestError hook captures a server-side event.
export function GET() {
  throw new Error("Sentry server test error from Sadrax 🚨");
  // eslint-disable-next-line no-unreachable
  return NextResponse.json({ ok: true });
}
