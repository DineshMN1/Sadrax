import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { advance } from "@/lib/recurring";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db.select().from(subscriptions).where(eq(subscriptions.userId, session.user.id)).orderBy(desc(subscriptions.id));
  return NextResponse.json({ subscriptions: rows });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { items, addressId, frequency } = await req.json();
  if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ error: "No items" }, { status: 400 });
  if (!["weekly", "biweekly", "monthly"].includes(frequency)) return NextResponse.json({ error: "Invalid frequency" }, { status: 400 });

  const clean = items
    .map((i: { productId: number; quantity: number }) => ({ productId: Number(i.productId), quantity: Math.max(1, Number(i.quantity) || 1) }))
    .filter((i) => i.productId);

  const [sub] = await db.insert(subscriptions).values({
    userId: session.user.id,
    addressId: addressId ? Number(addressId) : null,
    items: clean,
    frequency,
    nextRunAt: advance(new Date(), frequency),
    active: true,
  }).returning();

  return NextResponse.json({ subscription: sub });
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, active } = await req.json();
  const [sub] = await db.update(subscriptions).set({ active: !!active })
    .where(and(eq(subscriptions.id, Number(id)), eq(subscriptions.userId, session.user.id))).returning();
  return NextResponse.json({ subscription: sub });
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await db.delete(subscriptions).where(and(eq(subscriptions.id, Number(id)), eq(subscriptions.userId, session.user.id)));
  return NextResponse.json({ success: true });
}
