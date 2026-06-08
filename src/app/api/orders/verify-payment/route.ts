// ╔══════════════════════════════════════════════════════════════════╗
// ║  NOT IN PLAN FOR NOW — Razorpay payment verification webhook     ║
// ║  Enable when: Razorpay integration is ready (see razorpay.ts)   ║
// ╚══════════════════════════════════════════════════════════════════╝

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyPaymentSignature } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();

  const valid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  await db
    .update(orders)
    .set({ paymentStatus: "paid", razorpayPaymentId })
    .where(and(eq(orders.id, Number(orderId)), eq(orders.userId, session.user.id)));

  return NextResponse.json({ success: true });
}
