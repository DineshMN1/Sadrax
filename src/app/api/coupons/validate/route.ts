import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { formatPrice } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const { code, subtotal } = await req.json();

  if (!code) return NextResponse.json({ error: "No code provided" }, { status: 400 });

  const [coupon] = await db
    .select()
    .from(coupons)
    .where(and(eq(coupons.code, code.toUpperCase()), eq(coupons.active, true)))
    .limit(1);

  if (!coupon) return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return NextResponse.json({ error: "Coupon has expired" }, { status: 400 });
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
  if (subtotal < (coupon.minOrder ?? 0)) {
    return NextResponse.json({ error: `Minimum order ${formatPrice(coupon.minOrder ?? 0)} required` }, { status: 400 });
  }

  const discount = coupon.type === "flat"
    ? coupon.value
    : Math.min(Math.round((subtotal * coupon.value) / 100), coupon.maxDiscount ?? Infinity);

  return NextResponse.json({ code: coupon.code, discount, type: coupon.type, value: coupon.value });
}
