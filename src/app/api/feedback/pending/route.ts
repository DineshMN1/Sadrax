import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, orderFeedback } from "@/lib/db/schema";
import { eq, and, desc, notInArray, sql } from "drizzle-orm";

// The most recent delivered order this customer hasn't rated yet — drives the
// post-delivery feedback popup.
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ order: null });

  const rated = db
    .select({ id: orderFeedback.orderId })
    .from(orderFeedback)
    .where(eq(orderFeedback.userId, session.user.id));

  const [order] = await db
    .select({ id: orders.id, orderNumber: orders.orderNumber })
    .from(orders)
    .where(and(
      eq(orders.userId, session.user.id),
      eq(orders.status, "delivered"),
      notInArray(orders.id, rated),
    ))
    .orderBy(desc(sql`coalesce(${orders.deliveredAt}, ${orders.updatedAt})`))
    .limit(1);

  return NextResponse.json({ order: order ?? null });
}
