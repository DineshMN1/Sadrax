import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

function isAdmin(session: Awaited<ReturnType<typeof auth.api.getSession>>) {
  // Only full admins can read the audit trail (not staff)
  return session && (session.user as { role?: string }).role === "admin";
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(300);
  return NextResponse.json({ logs: rows });
}
