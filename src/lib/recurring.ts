import { db } from "@/lib/db";
import { subscriptions, products, orders, orderItems } from "@/lib/db/schema";
import { and, eq, gte, lte, inArray, sql } from "drizzle-orm";
import { generateOrderNumber } from "@/lib/utils";
import { getStoreSettings, computeDeliveryFee, isStoreOpen } from "@/lib/settings";
import { restockItems, type StockLine } from "@/lib/inventory";
import { sendPushToUser } from "@/lib/push";

const PERIOD_DAYS: Record<string, number> = { weekly: 7, biweekly: 14, monthly: 30 };

export function advance(from: Date, frequency: string): Date {
  const days = PERIOD_DAYS[frequency] ?? 7;
  return new Date(from.getTime() + days * 86400_000);
}

// Create orders for all subscriptions due now. Returns a small summary.
export async function runDueSubscriptions(now: Date = new Date()): Promise<{ placed: number; skipped: number }> {
  const due = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.active, true), lte(subscriptions.nextRunAt, now)));

  const settings = await getStoreSettings();
  let placed = 0, skipped = 0;

  for (const sub of due) {
    const next = advance(sub.nextRunAt < now ? now : sub.nextRunAt, sub.frequency);
    const reserved: StockLine[] = [];
    try {
      if (!isStoreOpen(settings, now)) { await bump(sub.id, next); skipped++; continue; }

      const ids = sub.items.map((i) => i.productId);
      const dbProducts = await db.select().from(products).where(and(inArray(products.id, ids), eq(products.active, true)));

      // Build line items at current prices; bail if anything is unavailable/short
      const lines = sub.items.map((it) => {
        const p = dbProducts.find((x) => x.id === it.productId);
        return p && p.stock >= it.quantity ? { p, qty: it.quantity } : null;
      });
      if (lines.some((l) => l === null)) {
        sendPushToUser(sub.userId, { title: "Recurring order skipped", body: "Some items were out of stock. We'll try next cycle.", url: "/account" }).catch(() => {});
        await bump(sub.id, next); skipped++; continue;
      }

      // Reserve stock atomically with compensation
      let ok = true;
      for (const l of lines as { p: typeof products.$inferSelect; qty: number }[]) {
        const r = await db.update(products)
          .set({ stock: sql`${products.stock} - ${l.qty}`, orderCount: sql`${products.orderCount} + ${l.qty}` })
          .where(and(eq(products.id, l.p.id), gte(products.stock, l.qty)))
          .returning({ id: products.id });
        if (r.length === 0) { ok = false; break; }
        reserved.push({ productId: l.p.id, quantity: l.qty });
      }
      if (!ok) { await restockItems(reserved); await bump(sub.id, next); skipped++; continue; }

      const items = (lines as { p: typeof products.$inferSelect; qty: number }[]).map(({ p, qty }) => ({
        productId: p.id, productName: p.name, productImage: (p.images as string[])[0] ?? null,
        productUnit: p.unit, price: p.price, quantity: qty, total: p.price * qty,
      }));
      const subtotal = items.reduce((s, i) => s + i.total, 0);
      const deliveryFee = computeDeliveryFee(subtotal, settings);
      const total = subtotal + deliveryFee;
      const orderNumber = generateOrderNumber();

      const [order] = await db.insert(orders).values({
        orderNumber, userId: sub.userId, addressId: sub.addressId ?? null, status: "pending",
        paymentMethod: "cod", paymentStatus: "pending", subtotal, deliveryFee, discount: 0, total,
        notes: "Recurring order",
      }).returning();
      await db.insert(orderItems).values(items.map((i) => ({ ...i, orderId: order.id })));

      await db.update(subscriptions).set({ nextRunAt: next, lastOrderId: order.id }).where(eq(subscriptions.id, sub.id));
      sendPushToUser(sub.userId, { title: "Recurring order placed 🔁", body: `#${order.orderNumber} is on its way.`, url: `/orders/${order.id}` }).catch(() => {});
      placed++;
    } catch {
      if (reserved.length > 0) await restockItems(reserved);
      await bump(sub.id, next); skipped++;
    }
  }

  return { placed, skipped };
}

async function bump(id: number, next: Date) {
  await db.update(subscriptions).set({ nextRunAt: next }).where(eq(subscriptions.id, id));
}
