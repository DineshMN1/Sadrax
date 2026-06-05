import { db } from "@/lib/db";
import { orders, users } from "@/lib/db/schema";
import { eq, desc, or, isNull, notInArray, sql } from "drizzle-orm";
import { formatPrice } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { UserRound } from "lucide-react";

export default async function AdminCustomersPage() {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      createdAt: users.createdAt,
      orderCount: sql<number>`count(${orders.id})`,
      totalSpent: sql<number>`coalesce(sum(case when ${orders.status} <> 'cancelled' then ${orders.total} else 0 end), 0)`,
      lastOrderAt: sql<string | null>`max(${orders.createdAt})`,
    })
    .from(users)
    .leftJoin(orders, eq(orders.userId, users.id))
    // Everyone who isn't staff/admin counts as a customer (role defaults to "customer")
    .where(or(isNull(users.role), notInArray(users.role, ["admin", "staff"])))
    .groupBy(users.id)
    .orderBy(sql`max(${orders.createdAt}) desc nulls last`, desc(users.createdAt))
    .limit(200);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{rows.length} customer{rows.length === 1 ? "" : "s"}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Customer", "Contact", "Orders", "Spent", "Last order"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <Link href={`/admin/customers/${c.id}`} className="flex items-center gap-2.5 group">
                    <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                      <UserRound size={15} className="text-gray-500" />
                    </div>
                    <span className="font-semibold text-gray-900 group-hover:text-green-600">{c.name ?? "Guest"}</span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  <div className="text-xs">{c.phone ?? "—"}</div>
                  <div className="text-xs text-gray-400 truncate max-w-45">{c.email ?? ""}</div>
                </td>
                <td className="px-4 py-3 font-semibold text-gray-700">{Number(c.orderCount)}</td>
                <td className="px-4 py-3 font-semibold">{formatPrice(Number(c.totalSpent))}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {c.lastOrderAt ? formatDistanceToNow(new Date(c.lastOrderAt), { addSuffix: true }) : "Never"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-sm">No customers yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
