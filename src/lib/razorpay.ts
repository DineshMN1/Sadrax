// ╔══════════════════════════════════════════════════════════════════╗
// ║  NOT IN PLAN FOR NOW — Razorpay payment integration              ║
// ║  Enable when: UPI/card webhook handler is implemented            ║
// ║  Ref: needs /api/orders/verify-payment webhook + frontend flow   ║
// ╚══════════════════════════════════════════════════════════════════╝

import Razorpay from "razorpay";
import crypto from "crypto";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function createRazorpayOrder(amountInPaise: number, receiptId: string) {
  return razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: receiptId,
  });
}

export function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string
): boolean {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");
  return expectedSignature === signature;
}
