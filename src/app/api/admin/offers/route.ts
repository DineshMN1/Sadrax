import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { offers } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { logAudit } from "@/lib/audit";

function isAdmin(session: Awaited<ReturnType<typeof auth.api.getSession>>) {
  return session && ["admin", "staff"].includes((session.user as { role?: string }).role ?? "");
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rows = await db.select().from(offers).orderBy(offers.order, desc(offers.id));
  return NextResponse.json({ offers: rows });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const b = await req.json();
  if (!b.title || !b.type) return NextResponse.json({ error: "Title and type required" }, { status: 400 });

  const [offer] = await db.insert(offers).values({
    title: b.title,
    description: b.description ?? null,
    type: b.type,
    categoryId: b.categoryId ?? null,
    percent: b.percent ?? 0,
    maxDiscount: b.maxDiscount ?? null,
    minOrder: b.minOrder ?? 0,
    bankName: b.bankName ?? null,
    code: b.code ?? null,
    active: b.active ?? true,
    order: b.order ?? 0,
    expiresAt: b.expiresAt ? new Date(b.expiresAt) : null,
  }).returning();

  logAudit(req, session, { action: "create", entity: "offer", entityId: offer.id, summary: `Created offer "${offer.title}"` });
  return NextResponse.json({ offer });
}
