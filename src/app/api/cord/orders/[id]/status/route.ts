import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/utils";
// NOT IN PLAN FOR NOW — import { sendOrderStatusSms } from "@/lib/msg91";
import { sendPushToUser } from "@/lib/push";
import { restockOrder } from "@/lib/inventory";

// Statuses where the order no longer holds reserved stock
const STOCK_RELEASING = ["cancelled", "rejected"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !["admin", "staff"].includes((session.user as { role?: string }).role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { status, reason } = await req.json();

  if (!ORDER_STATUSES.includes(status as OrderStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Need the previous status to decide whether to release stock
  const [existing] = await db.select().from(orders).where(eq(orders.id, Number(id))).limit(1);
  if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const [order] = await db
    .update(orders)
    .set({
      status,
      rejectionReason: reason ?? null,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, Number(id)))
    .returning();

  // Release reserved stock when an order moves into cancelled/rejected for the
  // first time (guard prevents double-restock if set again).
  if (STOCK_RELEASING.includes(status) && !STOCK_RELEASING.includes(existing.status)) {
    await restockOrder(order.id);
  }

  // NOT IN PLAN FOR NOW — SMS on status change (needs MSG91 templates configured)
  // const [user] = await db.select().from(users).where(eq(users.id, order.userId)).limit(1);
  // if (user?.phone) {
  //   sendOrderStatusSms(user.phone, order.orderNumber, status).catch(() => {});
  // }

  // Push notification on key status changes
  const pushMessages: Record<string, { title: string; body: string }> = {
    accepted:         { title: "Order Accepted ✅",     body: `#${order.orderNumber} is being prepared` },
    packed:           { title: "Order Packed 📦",        body: `#${order.orderNumber} is packed and ready` },
    out_for_delivery: { title: "Out for Delivery 🛵",    body: `#${order.orderNumber} is on the way to you!` },
    delivered:        { title: "Order Delivered 🎉",     body: `#${order.orderNumber} delivered. Enjoy!` },
    rejected:         { title: "Order Could Not Be Processed", body: `#${order.orderNumber} was rejected. Contact us for help.` },
  };

  if (pushMessages[status]) {
    sendPushToUser(order.userId, {
      ...pushMessages[status],
      url: `/orders/${order.id}`,
    }).catch(() => {});
  }

  return NextResponse.json({ order });
}
