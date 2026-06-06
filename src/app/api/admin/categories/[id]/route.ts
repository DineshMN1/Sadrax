import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logAudit, diffSummary } from "@/lib/audit";

function isAdmin(session: Awaited<ReturnType<typeof auth.api.getSession>>) {
  return session && ["admin", "staff"].includes((session.user as { role?: string }).role ?? "");
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const [before] = await db.select().from(categories).where(eq(categories.id, Number(id))).limit(1);
  const [cat] = await db.update(categories).set(body).where(eq(categories.id, Number(id))).returning();

  if (before) {
    const summary = diffSummary(before as Record<string, unknown>, body, Object.keys(body)) || "updated";
    logAudit(req, session, { action: "update", entity: "category", entityId: id, summary: `${before.name}: ${summary}` });
  }
  return NextResponse.json({ category: cat });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const [before] = await db.select().from(categories).where(eq(categories.id, Number(id))).limit(1);
  await db.delete(categories).where(eq(categories.id, Number(id)));
  logAudit(req, session, { action: "delete", entity: "category", entityId: id, summary: `Deleted ${before?.name ?? `#${id}`}` });
  return NextResponse.json({ success: true });
}
