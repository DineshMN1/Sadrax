import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/utils";
import { sendOrderStatusSms } from "@/lib/msg91";

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

  const [order] = await db
    .update(orders)
    .set({
      status,
      rejectionReason: reason ?? null,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, Number(id)))
    .returning();

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // SMS notification
  const [user] = await db.select().from(users).where(eq(users.id, order.userId)).limit(1);
  if (user?.phone) {
    sendOrderStatusSms(user.phone, order.orderNumber, status).catch(() => {});
  }

  return NextResponse.json({ order });
}
