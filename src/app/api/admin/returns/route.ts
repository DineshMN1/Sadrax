import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { returnRequests, orders, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

function isAdmin(session: Awaited<ReturnType<typeof auth.api.getSession>>) {
  return session && ["admin", "staff"].includes((session.user as { role?: string }).role ?? "");
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await db
    .select({
      request: returnRequests,
      orderNumber: orders.orderNumber,
      orderTotal: orders.total,
      paymentMethod: orders.paymentMethod,
      customerName: users.name,
      customerPhone: users.phone,
    })
    .from(returnRequests)
    .leftJoin(orders, eq(returnRequests.orderId, orders.id))
    .leftJoin(users, eq(returnRequests.userId, users.id))
    .orderBy(desc(returnRequests.createdAt));

  return NextResponse.json({ requests: rows });
}
