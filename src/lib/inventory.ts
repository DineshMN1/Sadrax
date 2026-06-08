import { db } from "@/lib/db";
import { products, orderItems } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export interface StockLine {
  productId: number;
  quantity: number;
  variantIdx?: number; // set when the product uses embedded variants
}

/**
 * Add stock back and reverse the order-count bump for a set of line items.
 * Handles both flat-stock products and embedded-variant products.
 */
export async function restockItems(items: StockLine[]): Promise<void> {
  for (const it of items) {
    if (it.variantIdx !== undefined) {
      const vi = it.variantIdx;
      await db
        .update(products)
        .set({
          variants: sql`jsonb_set(${products.variants}::jsonb, ARRAY[${vi}::text, 'stock'], to_jsonb((${products.variants}::jsonb->${vi}->>'stock')::integer + ${it.quantity}))::json`,
          orderCount: sql`GREATEST(${products.orderCount} - ${it.quantity}, 0)`,
        })
        .where(eq(products.id, it.productId));
    } else {
      await db
        .update(products)
        .set({
          stock: sql`${products.stock} + ${it.quantity}`,
          orderCount: sql`GREATEST(${products.orderCount} - ${it.quantity}, 0)`,
        })
        .where(eq(products.id, it.productId));
    }
  }
}

/**
 * Restore stock for every line item of an order. Skips lines whose product
 * has since been deleted (productId is null). Safe to call once per
 * stock-releasing transition (caller must guard against double-restock).
 * Note: order items don't store variantIdx, so only flat-stock is restored here.
 * Variant stock for order items is managed separately if needed.
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
