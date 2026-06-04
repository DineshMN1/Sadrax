import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { eq, and, or, isNull, gt } from "drizzle-orm";
import { formatPrice } from "@/lib/utils";

export async function GET() {
  const now = new Date();
  const rows = await db
    .select({
      id: coupons.id,
      code: coupons.code,
      type: coupons.type,
      value: coupons.value,
      minOrder: coupons.minOrder,
      maxDiscount: coupons.maxDiscount,
      expiresAt: coupons.expiresAt,
      maxUses: coupons.maxUses,
      usedCount: coupons.usedCount,
    })
    .from(coupons)
    .where(
      and(
        eq(coupons.active, true),
        or(isNull(coupons.expiresAt), gt(coupons.expiresAt, now))
      )
    )
    .limit(20);

  // Filter out fully used coupons and format for display
  const available = rows
    .filter(c => !c.maxUses || c.usedCount < c.maxUses)
    .map(c => ({
      id: c.id,
      code: c.code,
      label: c.type === "flat"
        ? `${formatPrice(c.value)} OFF`
        : `${c.value}% OFF${c.maxDiscount ? ` up to ${formatPrice(c.maxDiscount)}` : ""}`,
      description: c.minOrder && c.minOrder > 0
        ? `On orders above ${formatPrice(c.minOrder)}`
        : "No minimum order",
      expiresAt: c.expiresAt,
      type: c.type,
      value: c.value,
    }));

  return NextResponse.json({ coupons: available });
}
