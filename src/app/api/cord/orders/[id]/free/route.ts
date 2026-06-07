import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendPushToUser } from "@/lib/push";
import { logAudit } from "@/lib/audit";

// Staff marks an order "on the house": total -> ₹0, with a note shown on the
// invoice and pushed to the customer.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !["admin", "staff"].includes((session.user as { role?: string }).role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { note } = await req.json();

  const [existing] = await db.select().from(orders).where(eq(orders.id, Number(id))).limit(1);
  if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Everything becomes discount so the bill maths still add up to ₹0.
  const newDiscount = existing.subtotal + existing.deliveryFee + existing.tip;
  const [order] = await db
    .update(orders)
    .set({ discount: newDiscount, total: 0, freeNote: (note ?? "").toString().slice(0, 300) || "Your order is on us 🎉", updatedAt: new Date() })
    .where(eq(orders.id, Number(id)))
    .returning();

  sendPushToUser(order.userId, {
    title: "Your order is FREE! 🎉",
    body: order.freeNote ?? `#${order.orderNumber} is on the house.`,
    url: `/orders/${order.id}`,
  }).catch(() => {});

  logAudit(req, session, { action: "update", entity: "order", entityId: order.orderNumber, summary: `Made #${order.orderNumber} FREE${note ? ` — "${note}"` : ""}` });

  return NextResponse.json({ order });
}
