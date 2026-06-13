import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { purchases, products, suppliers } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import { notifyBackInStock } from "@/lib/stock-alerts";

function isAdmin(session: Awaited<ReturnType<typeof auth.api.getSession>>) {
  return session && ["admin", "staff"].includes((session.user as { role?: string }).role ?? "");
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rows = await db
    .select({
      id: purchases.id, quantity: purchases.quantity, costPrice: purchases.costPrice,
      note: purchases.note, createdAt: purchases.createdAt,
      productName: products.name, supplierName: suppliers.name,
    })
    .from(purchases)
    .leftJoin(products, eq(purchases.productId, products.id))
    .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
    .orderBy(desc(purchases.createdAt))
    .limit(200);
  return NextResponse.json({ purchases: rows });
}

// Record a stock-in receipt: logs the purchase AND increments product stock.
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { productId, supplierId, quantity, costPrice, note } = await req.json();
  const qty = Number(quantity);
  if (!productId || !Number.isInteger(qty) || qty <= 0) {
    return NextResponse.json({ error: "Product and a positive quantity are required" }, { status: 400 });
  }

  const [before] = await db.select().from(products).where(eq(products.id, Number(productId))).limit(1);
  if (!before) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const [purchase] = await db.insert(purchases).values({
    productId: Number(productId),
    supplierId: supplierId ? Number(supplierId) : null,
    quantity: qty,
    costPrice: costPrice != null ? Math.round(Number(costPrice) * 100) : null,
    note: note ?? null,
  }).returning();

  await db.update(products)
    .set({
      stock: sql`${products.stock} + ${qty}`,
      // Also increment variants[0].stock when the product has embedded variants so
      // both fields stay in sync (only flat stock was updated before, causing stale
      // variant stock to block orders for single-variant products).
      variants: sql`CASE WHEN jsonb_array_length(${products.variants}::jsonb) > 0 THEN jsonb_set(${products.variants}::jsonb, ARRAY['0', 'stock'], to_jsonb((${products.variants}::jsonb->0->>'stock')::integer + ${qty}))::json ELSE ${products.variants} END`,
      updatedAt: new Date(),
    })
    .where(eq(products.id, Number(productId)));

  if (before.stock === 0 && qty > 0) notifyBackInStock(before.id, before.name).catch(() => {});
  logAudit(req, session, { action: "create", entity: "purchase", entityId: purchase.id, summary: `Stock-in ${before.name}: +${qty} (now ${before.stock + qty})` });

  return NextResponse.json({ purchase });
}
