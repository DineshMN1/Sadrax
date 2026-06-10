import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
// NOT IN PLAN FOR NOW — import { sendOrderStatusSms } from "@/lib/msg91";
import { sendPushToUser } from "@/lib/push";
import { restockOrder } from "@/lib/inventory";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [order] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.id, Number(id)), eq(orders.userId, session.user.id)))
    .limit(1);

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const items = await db
    .select({
      id: orderItems.productId,
      variantIdx: orderItems.variantIdx,
      name: orderItems.productName,
      price: orderItems.price,
      unit: orderItems.productUnit,
      image: orderItems.productImage,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  return NextResponse.json({ items });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { action } = await req.json();

  if (action !== "cancel") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, Number(id)), eq(orders.userId, session.user.id)))
    .limit(1);

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (order.status !== "pending") {
    return NextResponse.json({ error: "Only pending orders can be cancelled" }, { status: 400 });
  }

  await db
    .update(orders)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(orders.id, order.id));

  // A pending order still holds its reserved stock — release it back.
  await restockOrder(order.id);

  // NOT IN PLAN FOR NOW — SMS on cancel (needs MSG91 templates configured)

  // Push notification confirming cancellation
  sendPushToUser(session.user.id, {
    title: "Order Cancelled",
    body: `#${order.orderNumber} has been cancelled as requested.`,
    url: `/orders/${order.id}`,
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
