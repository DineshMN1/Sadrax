import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, returnRequests, users } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { canRequestReturn, isValidReason, RETURN_REASON_LABELS } from "@/lib/returns";
import { sendTelegramMessage } from "@/lib/telegram";

// Fetch the existing request for this order (if any)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [request] = await db
    .select()
    .from(returnRequests)
    .where(and(eq(returnRequests.orderId, Number(id)), eq(returnRequests.userId, session.user.id)))
    .limit(1);

  return NextResponse.json({ request: request ?? null });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { reason, description, photos, items } = await req.json();

  // 1) Order must exist and belong to the customer
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, Number(id)), eq(orders.userId, session.user.id)))
    .limit(1);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // 2) Policy: delivered + within the return window
  if (!canRequestReturn(order)) {
    const msg = order.status !== "delivered"
      ? "Returns can only be raised after delivery."
      : "The 2-hour reporting window has closed. Please call us for health or safety concerns.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // 3) Allowed reason + required photo evidence
  if (!isValidReason(reason)) {
    return NextResponse.json({ error: "Please choose a valid reason." }, { status: 400 });
  }
  if (!Array.isArray(photos) || photos.length === 0) {
    return NextResponse.json({ error: "Please attach at least one photo of the issue." }, { status: 400 });
  }

  // 4) One open/decided request per order
  const existing = await db
    .select({ id: returnRequests.id })
    .from(returnRequests)
    .where(and(
      eq(returnRequests.orderId, order.id),
      inArray(returnRequests.status, ["pending", "approved"]),
    ))
    .limit(1);
  if (existing.length) {
    return NextResponse.json({ error: "A request for this order is already in progress." }, { status: 409 });
  }

  const [request] = await db
    .insert(returnRequests)
    .values({
      orderId: order.id,
      userId: session.user.id,
      reason,
      description: typeof description === "string" ? description.slice(0, 1000) : null,
      photos: photos.slice(0, 5),
      items: Array.isArray(items) ? items.slice(0, 50) : [],
      status: "pending",
    })
    .returning();

  // Notify the store
  const [customer] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  sendTelegramMessage(
    `🔁 <b>Return request</b> on #${order.orderNumber}\n` +
    `Reason: ${RETURN_REASON_LABELS[reason] ?? reason}\n` +
    (description ? `Note: ${String(description).slice(0, 300)}\n` : "") +
    `Photos: ${photos.length}\n` +
    `Customer: ${customer?.name ?? "—"}${customer?.phone ? ` (${customer.phone})` : ""}`
  ).catch(() => {});

  return NextResponse.json({ request });
}
