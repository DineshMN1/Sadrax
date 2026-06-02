import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, orderItems, products, coupons, addresses, users } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { generateOrderNumber, calculateDeliveryFee } from "@/lib/utils";
import { createRazorpayOrder } from "@/lib/razorpay";
import { sendOrderStatusSms } from "@/lib/msg91";
import { sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { addressId, paymentMethod, couponCode, items: cartItems } = body;

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
      return NextResponse.json({ error: `${p?.name ?? "Product"} is out of stock` }, { status: 400 });
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
  const deliveryFee = calculateDeliveryFee(subtotal);

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

    discount = coupon.type === "flat"
      ? coupon.value
      : Math.min(Math.round((subtotal * coupon.value) / 100), coupon.maxDiscount ?? Infinity);

    appliedCoupon = coupon;
  }

  const total = Math.max(0, subtotal + deliveryFee - discount);
  const orderNumber = generateOrderNumber();

  // Create order + items in transaction
  const [order] = await db
    .insert(orders)
    .values({
      orderNumber,
      userId: session.user.id,
      addressId: Number(addressId),
      status: "pending",
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
      subtotal,
      deliveryFee,
      discount,
      total,
      couponCode: couponCode ?? null,
    })
    .returning();

  await db.insert(orderItems).values(orderItemsData.map((i: Omit<typeof orderItems.$inferInsert, 'id' | 'orderId'>) => ({ ...i, orderId: order.id })));

  // Decrement stock + increment order counts
  for (const item of cartItems as { productId: number; quantity: number }[]) {
    await db
      .update(products)
      .set({
        stock: sql`${products.stock} - ${item.quantity}`,
        orderCount: sql`${products.orderCount} + ${item.quantity}`,
      })
      .where(eq(products.id, item.productId));
  }

  // Increment coupon usage
  if (appliedCoupon) {
    await db.update(coupons).set({ usedCount: sql`${coupons.usedCount} + 1` }).where(eq(coupons.id, appliedCoupon.id));
  }

  // For UPI/card, create Razorpay order
  if (paymentMethod !== "cod") {
    const rzpOrder = await createRazorpayOrder(total, order.orderNumber);
    await db.update(orders).set({ razorpayOrderId: rzpOrder.id }).where(eq(orders.id, order.id));
    return NextResponse.json({ orderId: order.id, orderNumber, razorpayOrderId: rzpOrder.id });
  }

  // Send SMS for COD
  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (user?.phone) {
    sendOrderStatusSms(user.phone, orderNumber, "pending").catch(() => {});
  }

  return NextResponse.json({ orderId: order.id, orderNumber });
}
