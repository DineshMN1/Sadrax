"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ShoppingBag, Clock, IndianRupee, Package, FileText } from "lucide-react";
import { formatPrice, STATUS_LABELS, STATUS_COLORS, ORDER_STATUSES, type OrderStatus } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export interface AdminOrder {
  id: number;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  total: number;
  createdAt: string;
  customerName: string | null;
  customerPhone: string | null;
  items: number;
}

type Tab = "all" | OrderStatus;

export function OrdersManager({ orders }: { orders: AdminOrder[] }) {
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const o of orders) m[o.status] = (m[o.status] ?? 0) + 1;
    return m;
  }, [orders]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return orders.filter((o) => {
      if (tab !== "all" && o.status !== tab) return false;
      if (!needle) return true;
      return (
        o.orderNumber.toLowerCase().includes(needle) ||
        (o.customerName ?? "").toLowerCase().includes(needle) ||
        (o.customerPhone ?? "").includes(needle)
      );
    });
  }, [orders, tab, q]);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayOrders = orders.filter((o) => new Date(o.createdAt) >= today);
  const pending = counts["pending"] ?? 0;
  const earned = orders.filter((o) => o.status === "delivered").reduce((s, o) => s + o.total, 0);

  // Tabs: All + only statuses that have orders, in canonical order
  const tabs: Tab[] = ["all", ...ORDER_STATUSES.filter((s) => counts[s])];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Orders</h1>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={<Clock size={18} />} tone="amber" value={pending} label="Pending" onClick={() => setTab("pending")} active={tab === "pending"} />
        <Stat icon={<ShoppingBag size={18} />} tone="blue" value={todayOrders.length} label="Today's orders" />
        <Stat icon={<IndianRupee size={18} />} tone="green" value={formatPrice(earned)} label="Revenue (delivered)" />
        <Stat icon={<Package size={18} />} tone="gray" value={orders.length} label="Total shown" onClick={() => setTab("all")} active={tab === "all"} />
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order #, customer name or phone…"
          className="w-full h-10 pl-9 pr-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500" />
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden pb-1">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${tab === t ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {t === "all" ? "All" : STATUS_LABELS[t]}
            <span className={`ml-1.5 text-xs ${tab === t ? "text-white/80" : "text-gray-400"}`}>
              {t === "all" ? orders.length : counts[t] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-150">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Order", "Customer", "Items", "Status", "Payment", "Total", "Time", "Invoice"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((o) => (
              <tr key={o.id} className={`hover:bg-gray-50/50 ${o.status === "pending" ? "bg-amber-50/40" : ""}`}>
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-semibold text-green-600 hover:underline whitespace-nowrap">#{o.orderNumber}</Link>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  <div className="min-w-0">
                    <p className="truncate max-w-40">{o.customerName ?? "—"}</p>
                    {o.customerPhone && <p className="text-xs text-gray-400">{o.customerPhone}</p>}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{o.items}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLORS[o.status as OrderStatus]}`}>
                    {STATUS_LABELS[o.status as OrderStatus]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 uppercase text-xs">{o.paymentMethod}</td>
                <td className="px-4 py-3 font-semibold whitespace-nowrap">{formatPrice(o.total)}</td>
                <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDistanceToNow(new Date(o.createdAt), { addSuffix: true })}</td>
                <td className="px-4 py-3">
                  <a href={`/orders/${o.id}/invoice`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-700 hover:underline whitespace-nowrap">
                    <FileText size={12} /> View
                  </a>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">
                {orders.length === 0 ? "No orders yet" : "No orders match this filter"}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 px-1">Showing {filtered.length} of {orders.length}</p>
    </div>
  );
}

function Stat({ icon, tone, value, label, onClick, active }: {
  icon: React.ReactNode; tone: "amber" | "blue" | "green" | "gray"; value: number | string; label: string;
  onClick?: () => void; active?: boolean;
}) {
  const tones: Record<string, string> = {
    amber: "bg-amber-50 text-amber-600", blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600", gray: "bg-gray-50 text-gray-600",
  };
  return (
    <button onClick={onClick} disabled={!onClick}
      className={`text-left bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-3 transition-colors ${active ? "border-green-300 ring-1 ring-green-200" : "border-gray-100"} ${onClick ? "hover:border-gray-200 cursor-pointer" : "cursor-default"}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tones[tone]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-400 mt-1 truncate">{label}</p>
      </div>
    </button>
  );
}
