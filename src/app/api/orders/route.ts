import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, orderItems, products, coupons, addresses, users, offers } from "@/lib/db/schema";
import { bestOfferDiscount } from "@/lib/offers";
import { eq, and, inArray, gte, ne } from "drizzle-orm";
import { generateOrderNumber, productHasVariants } from "@/lib/utils";
import { getStoreSettings, computeDeliveryFee, isStoreOpen } from "@/lib/settings";
import { checkRateLimit } from "@/lib/rate-limit";
import { restockItems, type StockLine } from "@/lib/inventory";
import { sql } from "drizzle-orm";
import { sendTelegramMessage, formatNewOrderMessage } from "@/lib/telegram";

type CartItem = { productId: number; variantIdx?: number; quantity: number };

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = checkRateLimit(req, "orders", 10, 5 * 60_000);
  if (limited) return limited;

  const body = await req.json();
  const { addressId, paymentMethod, couponCode, items: cartItems, deliveryLat, deliveryLng,
          tip, deliveryInstructions, deliverySlot } = body;

  if (!addressId || !paymentMethod || !cartItems?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!["cod", "upi", "card"].includes(paymentMethod)) {
    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
  }

  const [address] = await db
    .select()
    .from(addresses)
    .where(and(eq(addresses.id, Number(addressId)), eq(addresses.userId, session.user.id)))
    .limit(1);

  if (!address) return NextResponse.json({ error: "Invalid address" }, { status: 400 });

  const productIds = (cartItems as CartItem[]).map(i => i.productId);
  const dbProducts = await db
    .select()
    .from(products)
    .where(and(inArray(products.id, productIds), eq(products.active, true)));

  if (dbProducts.length !== productIds.length) {
    return NextResponse.json({ error: "Some products are unavailable" }, { status: 400 });
  }

  // Validate quantities and stock
  for (const item of cartItems as CartItem[]) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return NextResponse.json({ error: "Invalid item quantity" }, { status: 400 });
    }
    const p = dbProducts.find((p) => p.id === item.productId);
    const variants = p?.variants;
    const hasVariants = productHasVariants(variants);

    if (hasVariants) {
      const vi = item.variantIdx ?? 0;
      const v = variants[vi];
      if (!v) return NextResponse.json({ error: `Invalid variant for ${p?.name}` }, { status: 400 });
      if (v.stock < item.quantity) {
        const msg = v.stock === 0
          ? `${p?.name} (${v.unit}) is out of stock`
          : `Only ${v.stock} ${p?.name} (${v.unit}) left in stock`;
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    } else {
      if (!p || p.stock < item.quantity) {
        const msg = !p || p.stock === 0
          ? `${p?.name ?? "Product"} is out of stock`
          : `Only ${p.stock} ${p.name} left in stock`;
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    }
  }

  // Calculate totals — use variant price when applicable
  const orderItemsData = (cartItems as CartItem[]).map(item => {
    const p = dbProducts.find((p) => p.id === item.productId)!;
    const hasVariants = productHasVariants(p.variants);
    const vi = item.variantIdx ?? 0;
    const v = hasVariants ? p.variants[vi] : null;
    const price = v ? v.price : p.price;
    const unit = v ? v.unit : p.unit;
    return {
      productId: p.id,
      variantIdx: hasVariants ? vi : null,
      productName: p.name,
      productImage: (v?.image) ?? (p.images as string[])[0] ?? null,
      productUnit: unit,
      price,
      quantity: item.quantity,
      total: price * item.quantity,
    };
  });

  const subtotal = orderItemsData.reduce((s, i) => s + i.total, 0);
  const settings = await getStoreSettings();

  if (!isStoreOpen(settings)) {
    return NextResponse.json({ error: "Sorry, the store is currently closed. Please try again during opening hours." }, { status: 403 });
  }

  if (subtotal < settings.minOrderValue) {
    return NextResponse.json(
      { error: `Minimum order value is ₹${(settings.minOrderValue / 100).toFixed(0)}. Please add more items.` },
      { status: 400 },
    );
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

  let appliedLabel: string | null = couponCode ?? null;
  const activeOffers = await db.select().from(offers).where(eq(offers.active, true));
  const offerLines = orderItemsData.map(i => ({
    categoryId: dbProducts.find((p) => p.id === i.productId)?.categoryId ?? null,
    lineTotal: i.total,
  }));
  const { discount: offerDiscount, offer: bestOffer } = bestOfferDiscount(activeOffers, offerLines, subtotal);
  if (offerDiscount > discount) {
    discount = offerDiscount;
    appliedCoupon = null;
    appliedLabel = (bestOffer?.code || bestOffer?.title || "Offer").slice(0, 50);
  }

  const tipAmount = Math.max(0, Math.min(Math.round(Number(tip) || 0), 100000));
  const total = Math.max(0, subtotal + deliveryFee + tipAmount - discount);
  const orderNumber = generateOrderNumber();

  // Atomically reserve stock — variant or flat
  const reserved: StockLine[] = [];
  for (const item of cartItems as CartItem[]) {
    const p = dbProducts.find((p) => p.id === item.productId)!;
    const hasVariants = productHasVariants(p.variants);
    const vi = item.variantIdx ?? 0;

    let ok: { id: number }[];
    if (hasVariants) {
      ok = await db
        .update(products)
        .set({
          variants: sql`jsonb_set(${products.variants}::jsonb, ARRAY[${vi}::text, 'stock'], to_jsonb((${products.variants}::jsonb->${vi}->>'stock')::integer - ${item.quantity}))::json`,
          // Mirror first-variant decrement to flat stock so product cards stay accurate
          ...(vi === 0 ? { stock: sql`GREATEST(${products.stock} - ${item.quantity}, 0)` } : {}),
          orderCount: sql`${products.orderCount} + ${item.quantity}`,
        })
        .where(and(
          eq(products.id, item.productId),
          sql`(${products.variants}::jsonb->${vi}->>'stock')::integer >= ${item.quantity}`
        ))
        .returning({ id: products.id });
    } else {
      ok = await db
        .update(products)
        .set({
          stock: sql`${products.stock} - ${item.quantity}`,
          orderCount: sql`${products.orderCount} + ${item.quantity}`,
        })
        .where(and(eq(products.id, item.productId), gte(products.stock, item.quantity)))
        .returning({ id: products.id });
    }

    if (ok.length === 0) {
      await restockItems(reserved);
      const [fresh] = await db.select({ stock: products.stock, variants: products.variants }).from(products).where(eq(products.id, item.productId)).limit(1);
      const freshVariants = fresh?.variants as { stock: number }[] | null;
      const left = hasVariants
        ? (freshVariants?.[vi]?.stock ?? 0)
        : (fresh?.stock ?? 0);
      return NextResponse.json(
        { error: left > 0 ? `Only ${left} ${p.name} left in stock` : `${p.name} is out of stock` },
        { status: 409 }
      );
    }
    reserved.push({ productId: item.productId, quantity: item.quantity, variantIdx: hasVariants ? vi : undefined });
  }

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
        paymentStatus: "pending",
        subtotal,
        deliveryFee,
        discount,
        total,
        couponCode: appliedLabel,
        tip: tipAmount,
        deliveryInstructions: typeof deliveryInstructions === "string" ? deliveryInstructions.slice(0, 300) : null,
        deliverySlot: typeof deliverySlot === "string" ? deliverySlot.slice(0, 60) : null,
        deliveryLat: typeof deliveryLat === "number" ? deliveryLat : null,
        deliveryLng: typeof deliveryLng === "number" ? deliveryLng : null,
      })
      .returning();

    await db.insert(orderItems).values(orderItemsData.map(i => ({ ...i, orderId: order.id })));
  } catch (err) {
    await restockItems(reserved);
    throw err;
  }

  if (appliedCoupon) {
    await db.update(coupons).set({ usedCount: sql`${coupons.usedCount} + 1` }).where(eq(coupons.id, appliedCoupon.id));
  }

  const [customer] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  sendTelegramMessage(formatNewOrderMessage({
    orderNumber,
    customerName: customer?.name,
    phone: customer?.phone,
    total,
    subtotal,
    deliveryFee,
    discount,
    items: orderItemsData.map(i => ({ name: i.productName, qty: i.quantity, price: i.price })),
    address: address ? `${address.line1}${address.line2 ? ", " + address.line2 : ""}, ${address.city ?? ""} ${address.pincode}` : undefined,
    paymentMethod,
    cordUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/cord`,
  })).catch(() => {});

  return NextResponse.json({ orderId: order.id, orderNumber });
}
