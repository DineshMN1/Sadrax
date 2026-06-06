import { db } from "@/lib/db";
import { orders, orderItems, users } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { OrdersManager, type AdminOrder } from "./orders-manager";

export default async function AdminOrdersPage() {
  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      paymentMethod: orders.paymentMethod,
      total: orders.total,
      createdAt: orders.createdAt,
      customerName: users.name,
      customerPhone: users.phone,
      items: sql<number>`(select count(*)::int from ${orderItems} where ${orderItems.orderId} = ${orders.id})`,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.createdAt))
    .limit(200);

  const data: AdminOrder[] = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return <OrdersManager orders={data} />;
}
