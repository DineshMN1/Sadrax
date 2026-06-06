import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !["admin", "staff"].includes((session.user as { role?: string }).role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const { deliveryPersonId } = await req.json();
  const [order] = await db
    .update(orders)
    .set({ deliveryPersonId: deliveryPersonId ? Number(deliveryPersonId) : null, updatedAt: new Date() })
    .where(eq(orders.id, Number(id)))
    .returning();
  return NextResponse.json({ order });
}
