import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orderFeedback, orders, users } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";

function isAdmin(session: Awaited<ReturnType<typeof auth.api.getSession>>) {
  return session && ["admin", "staff"].includes((session.user as { role?: string }).role ?? "");
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [rows, [agg]] = await Promise.all([
    db
      .select({
        id: orderFeedback.id,
        rating: orderFeedback.rating,
        comment: orderFeedback.comment,
        createdAt: orderFeedback.createdAt,
        orderNumber: orders.orderNumber,
        orderId: orderFeedback.orderId,
        customerName: users.name,
      })
      .from(orderFeedback)
      .leftJoin(orders, eq(orderFeedback.orderId, orders.id))
      .leftJoin(users, eq(orderFeedback.userId, users.id))
      .orderBy(desc(orderFeedback.createdAt))
      .limit(200),
    db
      .select({
        count: sql<number>`count(*)::int`,
        avg: sql<number>`coalesce(round(avg(${orderFeedback.rating})::numeric, 2), 0)`,
      })
      .from(orderFeedback),
  ]);

  return NextResponse.json({ feedback: rows, count: agg?.count ?? 0, average: Number(agg?.avg ?? 0) });
}
