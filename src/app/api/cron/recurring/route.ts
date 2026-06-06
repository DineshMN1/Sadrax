import { NextRequest, NextResponse } from "next/server";
import { runDueSubscriptions } from "@/lib/recurring";

// Trigger from a scheduler (e.g. Dokploy cron) once a day:
//   curl -H "Authorization: Bearer $CRON_SECRET" https://app/api/cron/recurring
function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}` || req.nextUrl.searchParams.get("key") === secret;
}

async function handle(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const result = await runDueSubscriptions();
  return NextResponse.json({ ok: true, ...result });
}

export const GET = handle;
export const POST = handle;
