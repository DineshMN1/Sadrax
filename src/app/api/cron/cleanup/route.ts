import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auditLogs, pushSubscriptions } from "@/lib/db/schema";
import { lt } from "drizzle-orm";

// Run weekly from Dokploy cron:
//   curl -H "Authorization: Bearer $CRON_SECRET" https://app/api/cron/cleanup

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}` || req.nextUrl.searchParams.get("key") === secret;
}

async function handle(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const sixtyDaysAgo  = new Date(now.getTime() - 60  * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90  * 24 * 60 * 60 * 1000);

  const [deletedLogs, deletedSubs] = await Promise.all([
    db.delete(auditLogs).where(lt(auditLogs.createdAt, sixtyDaysAgo)).returning({ id: auditLogs.id }),
    db.delete(pushSubscriptions).where(lt(pushSubscriptions.createdAt, ninetyDaysAgo)).returning({ id: pushSubscriptions.id }),
  ]);

  return NextResponse.json({
    ok: true,
    auditLogsDeleted: deletedLogs.length,
    pushSubsDeleted: deletedSubs.length,
  });
}

export const GET  = handle;
export const POST = handle;
