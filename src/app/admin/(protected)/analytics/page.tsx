"use client";

import { useEffect, useState } from "react";
import { TrendingUp, ShoppingBag, IndianRupee, Package, RefreshCw } from "lucide-react";
import { formatPrice, STATUS_LABELS, STATUS_COLORS, type OrderStatus } from "@/lib/utils";

interface Analytics {
  today:  { count: number; revenue: number };
  week:   { count: number; revenue: number };
  month:  { count: number; revenue: number };
  statusBreakdown: { status: string; count: number }[];
  topProducts: { id: number; name: string; orderCount: number; price: number }[];
}

function StatCard({ label, count, revenue, accent }: { label: string; count: number; revenue: number; accent: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${accent}`}>{label}</p>
      <p className="text-3xl font-black text-gray-900 leading-none">{count}</p>
      <p className="text-sm font-semibold text-gray-400 mt-1">orders</p>
      <div className="mt-3 pt-3 border-t border-gray-50">
        <p className="text-lg font-extrabold text-gray-900">{formatPrice(revenue)}</p>
        <p className="text-xs text-gray-400">revenue</p>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData]     = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch_ = () => {
    setLoading(true);
    fetch("/api/admin/analytics")
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch_(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <button onClick={fetch_} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-sm font-semibold text-gray-600 rounded-xl hover:bg-gray-50 disabled:opacity-50">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : data ? (
        <>
          {/* Key metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Today"      count={data.today.count}  revenue={data.today.revenue}  accent="text-green-600" />
            <StatCard label="This Week"  count={data.week.count}   revenue={data.week.revenue}   accent="text-blue-600"  />
            <StatCard label="This Month" count={data.month.count}  revenue={data.month.revenue}  accent="text-purple-600"/>
          </div>

          {/* Status breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag size={16} className="text-green-600" />
              <h2 className="font-semibold text-gray-900">Order Status Breakdown</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.statusBreakdown.map(s => (
                <div key={s.status} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${STATUS_COLORS[s.status as OrderStatus] ?? "bg-gray-100 text-gray-600"}`}>
                  <span className="text-sm font-bold">{s.count}</span>
                  <span className="text-xs font-semibold">{STATUS_LABELS[s.status as OrderStatus] ?? s.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top products */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-green-600" />
              <h2 className="font-semibold text-gray-900">Top Products</h2>
            </div>
            <div className="space-y-3">
              {data.topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{formatPrice(p.price)}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded-lg">
                    <Package size={11} /> {p.orderCount}
                  </div>
                </div>
              ))}
              {data.topProducts.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No orders yet</p>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
