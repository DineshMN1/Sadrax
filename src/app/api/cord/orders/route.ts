import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, orderItems, addresses, users } from "@/lib/db/schema";
import { eq, desc, notInArray, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !["admin", "staff"].includes((session.user as { role?: string }).role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const filter = req.nextUrl.searchParams.get("filter") ?? "active";

  let rows;
  if (filter === "active") {
    rows = await db
      .select({ order: orders, address: addresses, customerPhone: users.phone })
      .from(orders)
      .leftJoin(addresses, eq(orders.addressId, addresses.id))
      .leftJoin(users, eq(orders.userId, users.id))
      .where(notInArray(orders.status, ["delivered", "rejected", "cancelled"]))
      .orderBy(desc(orders.createdAt))
      .limit(50);
  } else {
    rows = await db
      .select({ order: orders, address: addresses, customerPhone: users.phone })
      .from(orders)
      .leftJoin(addresses, eq(orders.addressId, addresses.id))
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt))
      .limit(100);
  }

  const orderIds = rows.map((r) => r.order.id);
  const allItems = orderIds.length
    ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds))
    : [];

  const result = rows.map(({ order, address, customerPhone }) => ({
    ...order,
    address: address ?? undefined,
    customerPhone: customerPhone ?? undefined,
    items: allItems.filter((i) => i.orderId === order.id),
  }));

  return NextResponse.json({ orders: result });
}
