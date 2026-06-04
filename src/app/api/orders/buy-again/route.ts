import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, orderItems, products } from "@/lib/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ products: [] });

  // Last 3 delivered orders
  const recentOrders = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.userId, session.user.id), eq(orders.status, "delivered")))
    .orderBy(desc(orders.createdAt))
    .limit(3);

  if (recentOrders.length === 0) return NextResponse.json({ products: [] });

  const orderIds = recentOrders.map(o => o.id);

  // Get product IDs from those orders (deduplicated)
  const items = await db
    .select({ productId: orderItems.productId })
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderIds));

  const productIds = [...new Set(items.map(i => i.productId).filter(Boolean) as number[])].slice(0, 8);
  if (productIds.length === 0) return NextResponse.json({ products: [] });

  const prods = await db
    .select()
    .from(products)
    .where(and(inArray(products.id, productIds), eq(products.active, true)));

  return NextResponse.json({ products: prods });
}
