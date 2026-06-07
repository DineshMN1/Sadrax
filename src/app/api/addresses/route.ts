import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { addresses } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getStoreSettings, isServiceable } from "@/lib/settings";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.select().from(addresses).where(eq(addresses.userId, session.user.id));
  return NextResponse.json({ addresses: rows });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, phone, line1, line2, city, pincode, label, lat, lng } = body;

  if (!name || !phone || !line1 || !pincode) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!isServiceable(pincode, await getStoreSettings())) {
    return NextResponse.json({ error: "We don't deliver to this pincode yet" }, { status: 400 });
  }

  // If this is first address, make it default
  const existing = await db.select({ id: addresses.id }).from(addresses).where(eq(addresses.userId, session.user.id)).limit(1);
  const isDefault = existing.length === 0;

  const [address] = await db
    .insert(addresses)
    .values({ userId: session.user.id, name, phone, line1, line2, city, pincode, label: label ?? "home", isDefault,
      lat: typeof lat === "number" ? lat : null, lng: typeof lng === "number" ? lng : null })
    .returning();

  return NextResponse.json({ address });
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, name, phone, line1, line2, city, pincode, label, isDefault, lat, lng } = body;

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Verify ownership
  const [existing] = await db.select().from(addresses)
    .where(and(eq(addresses.id, Number(id)), eq(addresses.userId, session.user.id))).limit(1);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (pincode && !isServiceable(pincode, await getStoreSettings())) {
    return NextResponse.json({ error: "We don't deliver to this pincode yet" }, { status: 400 });
  }

  // If setting as default, clear other defaults first
  if (isDefault) {
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, session.user.id));
  }

  const [updated] = await db.update(addresses)
    .set({ name, phone, line1, line2, city, pincode, label,
      ...(isDefault !== undefined ? { isDefault } : {}),
      ...(typeof lat === "number" ? { lat } : {}),
      ...(typeof lng === "number" ? { lng } : {}) })
    .where(eq(addresses.id, Number(id)))
    .returning();

  return NextResponse.json({ address: updated });
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();

  // Verify ownership before delete
  const [existing] = await db.select().from(addresses)
    .where(and(eq(addresses.id, Number(id)), eq(addresses.userId, session.user.id))).limit(1);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(addresses).where(eq(addresses.id, Number(id)));
  return NextResponse.json({ success: true });
}
