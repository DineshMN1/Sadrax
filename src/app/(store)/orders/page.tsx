import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { formatPrice, STATUS_LABELS, STATUS_COLORS, type OrderStatus } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { redirect } from "next/navigation";

export default async function OrdersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login?redirect=/orders");

  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, session.user.id))
    .orderBy(desc(orders.createdAt))
    .limit(50);

  if (userOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <span className="text-7xl mb-4">📦</span>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h2>
        <p className="text-gray-500 mb-6">Your order history will appear here</p>
        <Link href="/" className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3">
        <h1 className="text-lg font-bold text-gray-900">My Orders</h1>
      </div>
      <div className="px-4 py-4 space-y-3">
        {userOrders.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="block bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500">#{order.orderNumber}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status as OrderStatus]}`}>
                {STATUS_LABELS[order.status as OrderStatus]}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">{formatPrice(order.total)}</span>
              <span className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
