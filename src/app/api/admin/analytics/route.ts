import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, orderItems, products } from "@/lib/db/schema";
import { eq, gte, desc, sql, and, ne } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !["admin", "staff"].includes((session.user as { role?: string }).role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now       = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart  = new Date(now); weekStart.setDate(now.getDate() - 6);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [todayOrders, weekOrders, monthOrders, statusBreakdown, topProducts] = await Promise.all([
    // Today
    db.select({ count: sql<number>`count(*)`, revenue: sql<number>`coalesce(sum(total), 0)` })
      .from(orders)
      .where(and(gte(orders.createdAt, todayStart), ne(orders.status, "cancelled"))),

    // This week
    db.select({ count: sql<number>`count(*)`, revenue: sql<number>`coalesce(sum(total), 0)` })
      .from(orders)
      .where(and(gte(orders.createdAt, weekStart), ne(orders.status, "cancelled"))),

    // This month
    db.select({ count: sql<number>`count(*)`, revenue: sql<number>`coalesce(sum(total), 0)` })
      .from(orders)
      .where(and(gte(orders.createdAt, monthStart), ne(orders.status, "cancelled"))),

    // Status breakdown (all time)
    db.select({ status: orders.status, count: sql<number>`count(*)` })
      .from(orders)
      .groupBy(orders.status),

    // Top products by order count
    db.select({ id: products.id, name: products.name, orderCount: products.orderCount, price: products.price })
      .from(products)
      .where(eq(products.active, true))
      .orderBy(desc(products.orderCount))
      .limit(5),
  ]);

  return NextResponse.json({
    today:    { count: Number(todayOrders[0]?.count ?? 0), revenue: Number(todayOrders[0]?.revenue ?? 0) },
    week:     { count: Number(weekOrders[0]?.count ?? 0),  revenue: Number(weekOrders[0]?.revenue ?? 0)  },
    month:    { count: Number(monthOrders[0]?.count ?? 0), revenue: Number(monthOrders[0]?.revenue ?? 0) },
    statusBreakdown,
    topProducts,
  });
}
