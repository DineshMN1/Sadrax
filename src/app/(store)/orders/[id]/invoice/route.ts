import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, orderItems, addresses } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { buildInvoiceHtml } from "@/lib/invoice";

// Stable invoice link — the customer (order owner) can open/print it any time.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    // bounce to login, then back here
    const { id } = await params;
    return NextResponse.redirect(new URL(`/login?redirect=/orders/${id}/invoice`, req.url));
  }

  const { id } = await params;
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, Number(id)), eq(orders.userId, session.user.id)))
    .limit(1);
  if (!order) return new NextResponse("Invoice not found", { status: 404 });

  const [items, addr] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    order.addressId ? db.select().from(addresses).where(eq(addresses.id, order.addressId)).limit(1) : Promise.resolve([]),
  ]);

  const html = buildInvoiceHtml({
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    paymentMethod: order.paymentMethod,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    discount: order.discount,
    total: order.total,
    couponCode: order.couponCode,
    items: items.map((i) => ({ name: i.productName, unit: i.productUnit, quantity: i.quantity, price: i.price, total: i.total })),
    address: addr[0] ?? null,
  });

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
