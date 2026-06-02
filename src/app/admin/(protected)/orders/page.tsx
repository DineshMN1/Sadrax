import { db } from "@/lib/db";
import { orders, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { formatPrice, STATUS_LABELS, STATUS_COLORS, type OrderStatus } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default async function AdminOrdersPage() {
  const rows = await db
    .select({ order: orders, customerPhone: users.phone, customerName: users.name })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.createdAt))
    .limit(100);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Order", "Customer", "Status", "Payment", "Total", "Time"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map(({ order, customerPhone, customerName }) => (
              <tr key={order.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-semibold text-green-600 hover:underline">
                    #{order.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{customerName ?? customerPhone ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status as OrderStatus]}`}>
                    {STATUS_LABELS[order.status as OrderStatus]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 uppercase text-xs">{order.paymentMethod}</td>
                <td className="px-4 py-3 font-semibold">{formatPrice(order.total)}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">No orders yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
