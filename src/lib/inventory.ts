import { db } from "@/lib/db";
import { products, orderItems } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export interface StockLine {
  productId: number;
  quantity: number;
}

/**
 * Add stock back and reverse the order-count bump for a set of line items.
 * Used both to compensate a partially-reserved order and to release stock
 * when an order is cancelled or rejected.
 */
export async function restockItems(items: StockLine[]): Promise<void> {
  for (const it of items) {
    await db
      .update(products)
      .set({
        stock: sql`${products.stock} + ${it.quantity}`,
        // never let the popularity counter dip below zero
        orderCount: sql`GREATEST(${products.orderCount} - ${it.quantity}, 0)`,
      })
      .where(eq(products.id, it.productId));
  }
}

/**
 * Restore stock for every line item of an order. Skips lines whose product
 * has since been deleted (productId is null). Safe to call once per
 * stock-releasing transition (caller must guard against double-restock).
 */
export async function restockOrder(orderId: number): Promise<void> {
  const lines = await db
    .select({ productId: orderItems.productId, quantity: orderItems.quantity })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const valid = lines.filter(
    (l): l is StockLine => l.productId !== null
  );
  await restockItems(valid);
}
