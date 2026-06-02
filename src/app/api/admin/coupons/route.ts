import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

function isAdmin(s: Awaited<ReturnType<typeof auth.api.getSession>>) {
  return s && ["admin", "staff"].includes((s.user as { role?: string }).role ?? "");
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rows = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
  return NextResponse.json({ coupons: rows });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { code, type, value, minOrder, maxDiscount, maxUses, expiresAt } = body;
  if (!code || !type || value == null) return NextResponse.json({ error: "code, type, value required" }, { status: 400 });
  const [coupon] = await db.insert(coupons).values({
    code: code.toUpperCase(), type, value, minOrder: minOrder ?? 0,
    maxDiscount: maxDiscount ?? null, maxUses: maxUses ?? null,
    expiresAt: expiresAt ? new Date(expiresAt) : null, active: true,
  }).returning();
  return NextResponse.json({ coupon });
}
