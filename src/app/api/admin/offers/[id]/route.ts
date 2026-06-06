import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { offers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logAudit } from "@/lib/audit";

function isAdmin(session: Awaited<ReturnType<typeof auth.api.getSession>>) {
  return session && ["admin", "staff"].includes((session.user as { role?: string }).role ?? "");
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const b = await req.json();
  if (b.expiresAt !== undefined) b.expiresAt = b.expiresAt ? new Date(b.expiresAt) : null;

  const [offer] = await db.update(offers).set(b).where(eq(offers.id, Number(id))).returning();
  logAudit(req, session, { action: "update", entity: "offer", entityId: id, summary: `Updated offer "${offer?.title ?? id}"` });
  return NextResponse.json({ offer });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await db.delete(offers).where(eq(offers.id, Number(id)));
  logAudit(req, session, { action: "delete", entity: "offer", entityId: id, summary: `Deleted offer #${id}` });
  return NextResponse.json({ success: true });
}
