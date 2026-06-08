import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, orderItems, products } from "@/lib/db/schema";
import { eq, and, gte, inArray, sql } from "drizzle-orm";
import { getStoreSettings, computeDeliveryFee } from "@/lib/settings";
import { restockItems } from "@/lib/inventory";
import { sendPushToUser } from "@/lib/push";
import { logAudit } from "@/lib/audit";

const EDITABLE = ["pending", "accepted", "packed"];

// Staff edits an order's line items (customer call: drop/add/change quantities).
// Body: { items: [{ productId, quantity }] }  — the FULL desired line set.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !["admin", "staff"].includes((session.user as { role?: string }).role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const orderId = Number(id);
  const body = await req.json();
  const desired: { productId: number; quantity: number }[] = (body.items ?? [])
    .map((i: { productId: number; quantity: number }) => ({ productId: Number(i.productId), quantity: Math.max(0, Math.floor(Number(i.quantity) || 0)) }))
    .filter((i: { productId: number; quantity: number }) => i.productId > 0);

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (!EDITABLE.includes(order.status)) {
    return NextResponse.json({ error: `This order can no longer be edited (it is ${order.status}).` }, { status: 400 });
  }

  const current = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  const currentMap = new Map(current.map(i => [i.productId, i]));
  const desiredMap = new Map(desired.map(i => [i.productId, i.quantity]));

  const finalLines = desired.filter(d => d.quantity > 0);
  if (finalLines.length === 0) {
    return NextResponse.json({ error: "An order must have at least one item. Reject it instead if nothing is wanted." }, { status: 400 });
  }

  // Product info for any NEW products (not already on the order)
  const newPids = finalLines.map(d => d.productId).filter(pid => !currentMap.has(pid));
  const newProducts = newPids.length
    ? await db.select().from(products).where(inArray(products.id, newPids))
    : [];
  const newProdMap = new Map(newProducts.map(p => [p.id, p]));

  // ── Reserve added/increased quantity atomically (compensating restock on failure) ──
  const allPids = new Set<number>([...currentMap.keys(), ...desiredMap.keys()].filter((p): p is number => p != null));
  const reserved: { productId: number; quantity: number }[] = [];
  for (const pid of allPids) {
    const oldQty = currentMap.get(pid)?.quantity ?? 0;
    const newQty = desiredMap.get(pid) ?? 0;
    const delta = newQty - oldQty;
    if (delta <= 0) continue;
    const res = await db
      .update(products)
      .set({ stock: sql`${products.stock} - ${delta}`, orderCount: sql`${products.orderCount} + ${delta}` })
      .where(and(eq(products.id, pid), gte(products.stock, delta)))
      .returning({ id: products.id });
    if (res.length === 0) {
      if (reserved.length) await restockItems(reserved);   // roll back what we already took
      const [p] = await db.select({ name: products.name, stock: products.stock }).from(products).where(eq(products.id, pid)).limit(1);
      return NextResponse.json({ error: `Only ${p?.stock ?? 0} ${p?.name ?? "item"} left — can't add that many.` }, { status: 400 });
    }
    reserved.push({ productId: pid, quantity: delta });
  }

  // Restore stock for removed/reduced lines
  const released: { productId: number; quantity: number }[] = [];
  for (const pid of allPids) {
    const oldQty = currentMap.get(pid)?.quantity ?? 0;
    const newQty = desiredMap.get(pid) ?? 0;
    const delta = newQty - oldQty;
    if (delta < 0 && pid != null) released.push({ productId: pid, quantity: -delta });
  }
  if (released.length) await restockItems(released);

  // ── Snapshot originals on the first edit (for the struck/added diff) ──
  const originalItems = order.edited
    ? order.originalItems
    : current.map(i => ({ productId: i.productId, productName: i.productName, productUnit: i.productUnit, productImage: i.productImage, price: i.price, quantity: i.quantity }));

  // ── Rewrite line items to the desired set ──
  // update existing, insert new, delete removed
  for (const d of finalLines) {
    const existing = currentMap.get(d.productId);
    if (existing) {
      if (existing.quantity !== d.quantity) {
        await db.update(orderItems).set({ quantity: d.quantity, total: existing.price * d.quantity }).where(eq(orderItems.id, existing.id));
      }
    } else {
      const p = newProdMap.get(d.productId);
      if (!p) continue;
      await db.insert(orderItems).values({
        orderId, productId: p.id, productName: p.name,
        productImage: (p.images as string[])?.[0] ?? null, productUnit: p.unit,
        price: p.price, quantity: d.quantity, total: p.price * d.quantity,
      });
    }
  }
  const removedIds = current.filter(i => (desiredMap.get(i.productId!) ?? 0) === 0).map(i => i.id);
  if (removedIds.length) await db.delete(orderItems).where(inArray(orderItems.id, removedIds));

  // ── Recompute totals ──
  const settings = await getStoreSettings();
  const subtotal = finalLines.reduce((s, d) => {
    const price = currentMap.get(d.productId)?.price ?? newProdMap.get(d.productId)?.price ?? 0;
    return s + price * d.quantity;
  }, 0);
  const deliveryFee = computeDeliveryFee(subtotal, settings);
  // keep a "free" order free; otherwise honour the existing discount (clamped)
  const discount = order.freeNote ? subtotal + deliveryFee + order.tip : Math.min(order.discount, subtotal + deliveryFee + order.tip);
  const total = Math.max(0, subtotal + deliveryFee + order.tip - discount);

  await db.update(orders).set({
    subtotal, deliveryFee, discount, total,
    edited: true, editedAt: new Date(),
    originalItems: originalItems as object,
    updatedAt: new Date(),
  }).where(eq(orders.id, orderId));

  // Notify + audit
  sendPushToUser(order.userId, {
    title: "Your order was updated",
    body: `#${order.orderNumber} was changed by the store. New total: ₹${(total / 100).toFixed(0)}.`,
    url: `/orders/${orderId}`,
  }).catch(() => {});

  const summary = buildSummary(current, finalLines, newProdMap);
  logAudit(req, session, { action: "update", entity: "order", entityId: order.orderNumber, summary: `Edited #${order.orderNumber}: ${summary}` });

  return NextResponse.json({ ok: true, subtotal, deliveryFee, discount, total });
}

function buildSummary(
  current: { productId: number | null; productName: string; quantity: number }[],
  desired: { productId: number; quantity: number }[],
  newProdMap: Map<number, { name: string }>,
): string {
  const curMap = new Map(current.map(i => [i.productId, i]));
  const desMap = new Map(desired.map(d => [d.productId, d.quantity]));
  const parts: string[] = [];
  const pids = new Set<number>([...curMap.keys(), ...desMap.keys()].filter((p): p is number => p != null));
  for (const pid of pids) {
    const old = curMap.get(pid)?.quantity ?? 0;
    const neu = desMap.get(pid) ?? 0;
    const name = curMap.get(pid)?.productName ?? newProdMap.get(pid)?.name ?? `#${pid}`;
    if (old === neu) continue;
    if (old === 0) parts.push(`+${name} ×${neu}`);
    else if (neu === 0) parts.push(`−${name} ×${old}`);
    else parts.push(`${name} ×${old}→×${neu}`);
  }
  return parts.join(", ") || "no change";
}
