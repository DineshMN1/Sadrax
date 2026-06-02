import { db } from "@/lib/db";
import { orders, products, users } from "@/lib/db/schema";
import { eq, count, sum, desc, gte } from "drizzle-orm";
import { formatPrice } from "@/lib/utils";
import { ShoppingBag, Package, Users, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalOrders, todayOrders, totalRevenue, totalProducts, totalUsers] = await Promise.all([
    db.select({ count: count() }).from(orders),
    db.select({ count: count() }).from(orders).where(gte(orders.createdAt, today)),
    db.select({ sum: sum(orders.total) }).from(orders).where(eq(orders.paymentStatus, "paid")),
    db.select({ count: count() }).from(products).where(eq(products.active, true)),
    db.select({ count: count() }).from(users),
  ]);

  const recentOrders = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(5);

  const stats = [
    { label: "Today's Orders", value: todayOrders[0].count, icon: ShoppingBag, color: "bg-blue-50 text-blue-600" },
    { label: "Total Revenue", value: formatPrice(Number(totalRevenue[0].sum ?? 0)), icon: TrendingUp, color: "bg-green-50 text-green-600" },
    { label: "Active Products", value: totalProducts[0].count, icon: Package, color: "bg-purple-50 text-purple-600" },
    { label: "Total Customers", value: totalUsers[0].count, icon: Users, color: "bg-orange-50 text-orange-600" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs text-green-600 font-semibold">View all</Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">No orders yet</p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded-xl"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">#{order.orderNumber}</p>
                  <p className="text-xs text-gray-400">{order.status} · {order.paymentMethod.toUpperCase()}</p>
                </div>
                <span className="text-sm font-bold text-gray-900">{formatPrice(order.total)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
