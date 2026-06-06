import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, orderFeedback, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { rating, comment } = await req.json();

  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) {
    return NextResponse.json({ error: "Please give a 1–5 star rating" }, { status: 400 });
  }

  // Order must exist, belong to the customer and be delivered
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, Number(id)), eq(orders.userId, session.user.id)))
    .limit(1);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status !== "delivered") {
    return NextResponse.json({ error: "You can rate an order after it's delivered" }, { status: 400 });
  }

  try {
    const [feedback] = await db
      .insert(orderFeedback)
      .values({
        orderId: order.id,
        userId: session.user.id,
        rating: r,
        comment: typeof comment === "string" && comment.trim() ? comment.trim().slice(0, 500) : null,
      })
      .returning();

    // Ping the store for low ratings so they can follow up
    if (r <= 3) {
      const [customer] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
      sendTelegramMessage(
        `⭐ <b>${r}-star feedback</b> on #${order.orderNumber}\n` +
        (feedback.comment ? `“${feedback.comment}”\n` : "") +
        `Customer: ${customer?.name ?? "—"}${customer?.phone ? ` (${customer.phone})` : ""}`
      ).catch(() => {});
    }

    return NextResponse.json({ feedback });
  } catch {
    // unique index → already rated
    return NextResponse.json({ error: "You've already rated this order" }, { status: 409 });
  }
}
