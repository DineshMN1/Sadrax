import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import Link from "next/link";

const ACTIVE_STATUSES = ["pending", "accepted", "packed", "out_for_delivery"];

const STATUS_META: Record<string, { label: string; sub: string; icon: string; color: string }> = {
  pending:          { label: "Order received",       sub: "We got your order!",            icon: "🛒",  color: "bg-orange-50 border-orange-200" },
  accepted:         { label: "Accepted by store",    sub: "Being prepared for you",        icon: "✅",  color: "bg-blue-50 border-blue-200" },
  packed:           { label: "Packed & ready",       sub: "On its way to you soon",        icon: "📦",  color: "bg-indigo-50 border-indigo-200" },
  out_for_delivery: { label: "Out for delivery",     sub: "Arriving at your doorstep",     icon: "🛵",  color: "bg-green-50 border-green-200" },
};

export async function ActiveOrderBanner() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const [order] = await db
    .select({ id: orders.id, orderNumber: orders.orderNumber, status: orders.status, total: orders.total })
    .from(orders)
    .where(and(eq(orders.userId, session.user.id), inArray(orders.status, ACTIVE_STATUSES)))
    .orderBy(desc(orders.createdAt))
    .limit(1);

  if (!order) return null;

  const meta = STATUS_META[order.status] ?? { label: order.status, sub: "", icon: "📦", color: "bg-gray-50 border-gray-200" };

  return (
    <Link
      href={`/orders/${order.id}`}
      className={`flex items-center gap-3.5 border rounded-2xl px-4 py-3.5 hover:opacity-90 active:scale-[0.98] transition-all ${meta.color}`}
    >
      <span className="text-2xl shrink-0">{meta.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Active Order · #{order.orderNumber}</p>
        <p className="text-sm font-extrabold text-gray-900 mt-0.5">{meta.label}</p>
        <p className="text-xs text-gray-500">{meta.sub}</p>
      </div>
      <span className="text-xs font-bold text-green-700 bg-white border border-green-200 px-3 py-1.5 rounded-xl shrink-0">
        Track →
      </span>
    </Link>
  );
}
