import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Rider (staff) pings their live location for an active order.
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !["admin", "staff"].includes((session.user as { role?: string }).role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { orderId, lat, lng } = await req.json();
  if (!orderId || typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  await db.update(orders)
    .set({ riderLat: lat, riderLng: lng, riderUpdatedAt: new Date() })
    .where(eq(orders.id, Number(orderId)));
  return NextResponse.json({ success: true });
}
