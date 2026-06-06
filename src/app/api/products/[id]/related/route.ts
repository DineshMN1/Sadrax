import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, orderItems } from "@/lib/db/schema";
import { and, eq, ne, sql, inArray } from "drizzle-orm";

// Frequently bought together: products that co-occur in orders with this one,
// ranked by co-purchase count. Falls back to same-category popular items.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pid = Number(id);

  const co = await db
    .select({ productId: orderItems.productId, n: sql<number>`count(*)::int` })
    .from(orderItems)
    .where(and(
      ne(orderItems.productId, pid),
      inArray(
        orderItems.orderId,
        db.select({ oid: orderItems.orderId }).from(orderItems).where(eq(orderItems.productId, pid)),
      ),
    ))
    .groupBy(orderItems.productId)
    .orderBy(sql`count(*) desc`)
    .limit(6);

  let ids = co.map((c) => c.productId).filter((x): x is number => x != null);

  // Fallback: same-category popular products
  if (ids.length === 0) {
    const [self] = await db.select({ categoryId: products.categoryId }).from(products).where(eq(products.id, pid)).limit(1);
    if (self?.categoryId) {
      const fallback = await db
        .select({ id: products.id })
        .from(products)
        .where(and(eq(products.categoryId, self.categoryId), eq(products.active, true), ne(products.id, pid)))
        .orderBy(sql`${products.orderCount} desc`)
        .limit(6);
      ids = fallback.map((f) => f.id);
    }
  }

  if (ids.length === 0) return NextResponse.json({ products: [] });

  const rows = await db.select().from(products).where(and(inArray(products.id, ids), eq(products.active, true)));
  // preserve co-purchase ranking
  rows.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  return NextResponse.json({ products: rows });
}
