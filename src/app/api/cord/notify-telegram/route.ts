import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, orderItems, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendTelegramMessage, formatNewOrderMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (!["admin", "staff"].includes(role ?? "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { orderId } = await req.json();
  const [order] = await db.select().from(orders).where(eq(orders.id, Number(orderId))).limit(1);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const [items, customer] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    db.select().from(users).where(eq(users.id, order.userId)).limit(1),
  ]);

  await sendTelegramMessage(formatNewOrderMessage({
    orderNumber: order.orderNumber,
    customerName: customer[0]?.name,
    phone: customer[0]?.phone,
    total: order.total,
    items: items.map(i => ({ name: i.productName, qty: i.quantity, price: i.price })),
    paymentMethod: order.paymentMethod,
    cordUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/cord`,
  }));

  return NextResponse.json({ success: true });
}
