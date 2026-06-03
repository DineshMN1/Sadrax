import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { formatPrice, STATUS_LABELS, STATUS_COLORS, type OrderStatus } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Package, ChevronRight, ShoppingBag } from "lucide-react";

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
        <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-5">
          <Package size={32} className="text-gray-300" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-2">No orders yet</h2>
        <p className="text-gray-500 text-sm mb-6 max-w-xs">
          Your order history will appear here once you place your first order.
        </p>
        <Link href="/" className="flex items-center gap-2 bg-green-600 text-white px-7 py-3 rounded-xl font-bold text-sm hover:bg-green-700 transition-colors">
          <ShoppingBag size={16} /> Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3">
        <h1 className="text-lg font-extrabold text-gray-900">My Orders</h1>
        <p className="text-xs text-gray-400 mt-0.5">{userOrders.length} order{userOrders.length !== 1 ? "s" : ""} placed</p>
      </div>

      <div className="px-4 py-4 space-y-3">
        {userOrders.map(order => {
          const isActive = !["delivered", "rejected", "cancelled"].includes(order.status);
          return (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.99] transition-all overflow-hidden"
            >
              {/* Status bar */}
              <div className={`h-1 w-full ${isActive ? "bg-green-500" : "bg-gray-100"}`} />

              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-xs font-bold text-gray-400 font-mono">#{order.orderNumber}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</p>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status as OrderStatus]}`}>
                    {STATUS_LABELS[order.status as OrderStatus]}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-base font-extrabold text-gray-900">{formatPrice(order.total)}</span>
                    <span className="text-xs text-gray-400 ml-2 uppercase">{order.paymentMethod}</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
