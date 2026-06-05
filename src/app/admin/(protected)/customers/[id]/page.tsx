import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { orders, addresses, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { formatPrice, STATUS_LABELS, STATUS_COLORS, type OrderStatus } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { ChevronLeft, MapPin, Phone, Mail, UserRound, ShoppingBag } from "lucide-react";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [customer] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!customer) notFound();

  const [orderRows, addressRows] = await Promise.all([
    db.select().from(orders).where(eq(orders.userId, id)).orderBy(desc(orders.createdAt)),
    db.select().from(addresses).where(eq(addresses.userId, id)).orderBy(desc(addresses.isDefault)),
  ]);

  const totalSpent = orderRows
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/customers"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <ChevronLeft size={18} className="text-gray-600" />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-11 h-11 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0">
            <UserRound size={20} className="text-gray-500" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">{customer.name ?? "Guest"}</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Joined {format(new Date(customer.createdAt), "d MMM yyyy")}
            </p>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-green-600 mb-2">Orders</p>
          <p className="text-3xl font-black text-gray-900 leading-none">{orderRows.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-2">Total Spent</p>
          <p className="text-2xl font-black text-gray-900 leading-none">{formatPrice(totalSpent)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Contact */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
              <UserRound size={13} className="text-blue-600" />
            </div>
            <h2 className="text-sm font-extrabold text-gray-900">Contact</h2>
          </div>
          {customer.phone ? (
            <a href={`tel:+91${customer.phone}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-600 hover:underline">
              <Phone size={12} /> {customer.phone}
            </a>
          ) : (
            <p className="text-sm text-gray-400">No phone on record</p>
          )}
          {customer.email && (
            <a href={`mailto:${customer.email}`} className="flex items-center gap-1.5 mt-2 text-sm text-gray-500 hover:underline">
              <Mail size={12} /> {customer.email}
            </a>
          )}
        </div>

        {/* Addresses */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
              <MapPin size={13} className="text-green-600" />
            </div>
            <h2 className="text-sm font-extrabold text-gray-900">Addresses ({addressRows.length})</h2>
          </div>
          {addressRows.length === 0 ? (
            <p className="text-sm text-gray-400">No addresses saved</p>
          ) : (
            <div className="space-y-3">
              {addressRows.map((a) => (
                <div key={a.id} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{a.name}</span>
                    <span className="text-[10px] uppercase font-bold text-gray-400">{a.label}</span>
                    {a.isDefault && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Default</span>}
                  </div>
                  <p className="text-gray-500 mt-0.5">
                    {a.line1}{a.line2 ? `, ${a.line2}` : ""}
                  </p>
                  <p className="text-gray-400 text-xs">{a.city} — {a.pincode}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order history */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
          <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center">
            <ShoppingBag size={13} className="text-orange-600" />
          </div>
          <h2 className="text-sm font-extrabold text-gray-900">Order History</h2>
        </div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-50">
            {orderRows.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50/50">
                <td className="px-5 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-semibold text-green-600 hover:underline">
                    #{o.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status as OrderStatus]}`}>
                    {STATUS_LABELS[o.status as OrderStatus]}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold">{formatPrice(o.total)}</td>
                <td className="px-5 py-3 text-gray-400 text-xs text-right">
                  {formatDistanceToNow(new Date(o.createdAt), { addSuffix: true })}
                </td>
              </tr>
            ))}
            {orderRows.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-400 text-sm">No orders yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
