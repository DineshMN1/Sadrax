import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, orderItems, products, coupons, addresses, users } from "@/lib/db/schema";
import { eq, and, inArray, gte, ne } from "drizzle-orm";
import { generateOrderNumber } from "@/lib/utils";
import { getStoreSettings, computeDeliveryFee, isStoreOpen } from "@/lib/settings";
import { restockItems, type StockLine } from "@/lib/inventory";
// NOT IN PLAN FOR NOW — import { createRazorpayOrder } from "@/lib/razorpay";
// NOT IN PLAN FOR NOW — import { sendOrderStatusSms } from "@/lib/msg91";
import { sql } from "drizzle-orm";
import { sendTelegramMessage, formatNewOrderMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { addressId, paymentMethod, couponCode, items: cartItems, deliveryLat, deliveryLng } = body;

  if (!addressId || !paymentMethod || !cartItems?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!["cod", "upi", "card"].includes(paymentMethod)) {
    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
  }

  // Validate address belongs to user
  const [address] = await db
    .select()
    .from(addresses)
    .where(and(eq(addresses.id, Number(addressId)), eq(addresses.userId, session.user.id)))
    .limit(1);

  if (!address) return NextResponse.json({ error: "Invalid address" }, { status: 400 });

  // Fetch products
  const productIds = cartItems.map((i: { productId: number }) => i.productId);
  const dbProducts = await db
    .select()
    .from(products)
    .where(and(inArray(products.id, productIds), eq(products.active, true)));

  if (dbProducts.length !== productIds.length) {
    return NextResponse.json({ error: "Some products are unavailable" }, { status: 400 });
  }

  // Check stock
  for (const item of cartItems) {
    const p = dbProducts.find((p) => p.id === item.productId);
    if (!p || p.stock < item.quantity) {
      const msg = !p || p.stock === 0
        ? `${p?.name ?? "Product"} is out of stock`
        : `Only ${p.stock} ${p.name} left in stock`;
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  // Calculate totals
  const orderItemsData = cartItems.map((item: { productId: number; quantity: number }) => {
    const p = dbProducts.find((p) => p.id === item.productId)!;
    return {
      productId: p.id,
      productName: p.name,
      productImage: (p.images as string[])[0] ?? null,
      productUnit: p.unit,
      price: p.price,
      quantity: item.quantity,
      total: p.price * item.quantity,
    };
  });

  const subtotal = orderItemsData.reduce((s: number, i: { total: number }) => s + i.total, 0);
  const settings = await getStoreSettings();

  // Don't accept orders while the store is closed (manual toggle or outside hours)
  if (!isStoreOpen(settings)) {
    return NextResponse.json({ error: "Sorry, the store is currently closed. Please try again during opening hours." }, { status: 403 });
  }

  const deliveryFee = computeDeliveryFee(subtotal, settings);

  // Validate coupon
  let discount = 0;
  let appliedCoupon: typeof coupons.$inferSelect | null = null;
  if (couponCode) {
    const [coupon] = await db
      .select()
      .from(coupons)
      .where(and(eq(coupons.code, couponCode), eq(coupons.active, true)))
      .limit(1);

    if (!coupon) return NextResponse.json({ error: "Invalid coupon" }, { status: 400 });
    if (coupon.expiresAt && coupon.expiresAt < new Date()) return NextResponse.json({ error: "Coupon expired" }, { status: 400 });
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return NextResponse.json({ error: "Coupon limit reached" }, { status: 400 });
    if (subtotal < (coupon.minOrder ?? 0)) return NextResponse.json({ error: `Minimum order ${coupon.minOrder}` }, { status: 400 });

    // One use per customer — block reuse of the same code by the same user
    const [prior] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(and(eq(orders.userId, session.user.id), eq(orders.couponCode, couponCode), ne(orders.status, "cancelled")))
      .limit(1);
    if (prior) return NextResponse.json({ error: "You've already used this coupon" }, { status: 400 });

    discount = coupon.type === "flat"
      ? coupon.value
      : Math.min(Math.round((subtotal * coupon.value) / 100), coupon.maxDiscount ?? Infinity);

    appliedCoupon = coupon;
  }

  const total = Math.max(0, subtotal + deliveryFee - discount);
  const orderNumber = generateOrderNumber();

  // ── Atomically reserve stock (prevents overselling on concurrent orders) ──
  // The neon-http driver has no interactive transactions, so each decrement is
  // a conditional UPDATE that only succeeds if enough stock remains. If any
  // line fails, we compensate by restoring the ones already reserved.
  const reserved: StockLine[] = [];
  for (const item of cartItems as StockLine[]) {
    const ok = await db
      .update(products)
      .set({
        stock: sql`${products.stock} - ${item.quantity}`,
        orderCount: sql`${products.orderCount} + ${item.quantity}`,
      })
      .where(and(eq(products.id, item.productId), gte(products.stock, item.quantity)))
      .returning({ id: products.id });

    if (ok.length === 0) {
      await restockItems(reserved); // roll back what we already took
      const p = dbProducts.find((p) => p.id === item.productId);
      // re-read current stock for an accurate message
      const [fresh] = await db.select({ stock: products.stock }).from(products).where(eq(products.id, item.productId)).limit(1);
      const left = fresh?.stock ?? 0;
      return NextResponse.json(
        { error: left > 0 ? `Only ${left} ${p?.name ?? "item"} left in stock` : `${p?.name ?? "Product"} is out of stock` },
        { status: 409 }
      );
    }
    reserved.push(item);
  }

  // Stock is now reserved — create the order. If this fails, release the hold.
  let order: typeof orders.$inferSelect;
  try {
    [order] = await db
      .insert(orders)
      .values({
        orderNumber,
        userId: session.user.id,
        addressId: Number(addressId),
        status: "pending",
        paymentMethod,
        paymentStatus: "pending", // COD is collected on delivery; online pay flips this later
        subtotal,
        deliveryFee,
        discount,
        total,
        couponCode: couponCode ?? null,
        deliveryLat: typeof deliveryLat === "number" ? deliveryLat : null,
        deliveryLng: typeof deliveryLng === "number" ? deliveryLng : null,
      })
      .returning();

    await db.insert(orderItems).values(orderItemsData.map((i: Omit<typeof orderItems.$inferInsert, 'id' | 'orderId'>) => ({ ...i, orderId: order.id })));
  } catch (err) {
    await restockItems(reserved); // don't leak the reserved stock
    throw err;
  }

  // Increment coupon usage
  if (appliedCoupon) {
    await db.update(coupons).set({ usedCount: sql`${coupons.usedCount} + 1` }).where(eq(coupons.id, appliedCoupon.id));
  }

  // NOT IN PLAN FOR NOW — Razorpay UPI/card flow (needs webhook handler)
  // if (paymentMethod !== "cod") {
  //   const rzpOrder = await createRazorpayOrder(total, order.orderNumber);
  //   await db.update(orders).set({ razorpayOrderId: rzpOrder.id }).where(eq(orders.id, order.id));
  //   return NextResponse.json({ orderId: order.id, orderNumber, razorpayOrderId: rzpOrder.id });
  // }

  // NOT IN PLAN FOR NOW — Order placed SMS (needs MSG91 templates configured)
  // const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  // if (user?.phone) {
  //   sendOrderStatusSms(user.phone, orderNumber, "pending").catch(() => {});
  // }

  // Telegram notification to store owner on new order
  const [customer] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  sendTelegramMessage(formatNewOrderMessage({
    orderNumber,
    customerName: customer?.name,
    phone: customer?.phone,
    total,
    items: orderItemsData.map((i: { productName: string; quantity: number }) => ({ name: i.productName, qty: i.quantity })),
    address: address ? `${address.line1}${address.line2 ? ", " + address.line2 : ""}, ${address.city ?? ""} ${address.pincode}` : undefined,
    paymentMethod,
  })).catch(() => {});

  return NextResponse.json({ orderId: order.id, orderNumber });
}
