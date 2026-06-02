import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { addresses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isDeliverable } from "@/lib/utils";

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
  const { name, phone, line1, line2, city, pincode, label } = body;

  if (!name || !phone || !line1 || !pincode) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!isDeliverable(pincode)) {
    return NextResponse.json({ error: "We don't deliver to this pincode yet" }, { status: 400 });
  }

  // If this is first address, make it default
  const existing = await db.select({ id: addresses.id }).from(addresses).where(eq(addresses.userId, session.user.id)).limit(1);
  const isDefault = existing.length === 0;

  const [address] = await db
    .insert(addresses)
    .values({ userId: session.user.id, name, phone, line1, line2, city, pincode, label: label ?? "home", isDefault })
    .returning();

  return NextResponse.json({ address });
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await db.delete(addresses).where(eq(addresses.id, Number(id)));
  return NextResponse.json({ success: true });
}
