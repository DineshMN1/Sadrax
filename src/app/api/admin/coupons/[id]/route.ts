import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

function isAdmin(s: Awaited<ReturnType<typeof auth.api.getSession>>) {
  return s && ["admin", "staff"].includes((s.user as { role?: string }).role ?? "");
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const [coupon] = await db.update(coupons).set(body).where(eq(coupons.id, Number(id))).returning();
  return NextResponse.json({ coupon });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await db.delete(coupons).where(eq(coupons.id, Number(id)));
  return NextResponse.json({ success: true });
}
