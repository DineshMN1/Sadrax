"use client";

import { useEffect, useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Row {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  orderNumber: string | null;
  orderId: number;
  customerName: string | null;
}

export default function FeedbackPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(0); // 0 = all

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/feedback");
      const data = await res.json();
      setRows(data.feedback ?? []);
      setAvg(data.average ?? 0);
      setCount(data.count ?? 0);
      setLoading(false);
    })();
  }, []);

  const dist = [5, 4, 3, 2, 1].map((s) => ({ s, n: rows.filter((r) => r.rating === s).length }));
  const shown = filter === 0 ? rows : rows.filter((r) => r.rating === filter);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>
        <p className="text-sm text-gray-400 mt-0.5">Ratings customers left after delivery.</p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400"><Loader2 className="animate-spin mx-auto" /></div>
      ) : (
        <>
          {/* Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-wrap items-center gap-6">
            <div className="text-center">
              <p className="text-4xl font-extrabold text-gray-900 leading-none">{avg.toFixed(1)}</p>
              <div className="flex justify-center gap-0.5 mt-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={14} className={n <= Math.round(avg) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"} />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">{count} rating{count === 1 ? "" : "s"}</p>
            </div>
            <div className="flex-1 min-w-50 space-y-1">
              {dist.map(({ s, n }) => (
                <button key={s} onClick={() => setFilter(filter === s ? 0 : s)} className="flex items-center gap-2 w-full group">
                  <span className="text-xs text-gray-500 w-3">{s}</span>
                  <Star size={11} className="text-amber-400 fill-amber-400 shrink-0" />
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: count ? `${(n / count) * 100}%` : "0%" }} />
                  </div>
                  <span className={`text-xs w-6 text-right ${filter === s ? "font-bold text-amber-600" : "text-gray-400"}`}>{n}</span>
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="space-y-2.5">
            {shown.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} size={13} className={n <= r.rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"} />
                      ))}
                    </div>
                    {r.orderNumber && <span className="text-xs font-semibold text-gray-400">#{r.orderNumber}</span>}
                  </div>
                  <span className="text-xs text-gray-300">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</span>
                </div>
                {r.comment && <p className="text-sm text-gray-700 mt-2">“{r.comment}”</p>}
                <p className="text-xs text-gray-400 mt-1.5">{r.customerName ?? "Customer"}</p>
              </div>
            ))}
            {shown.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 px-4 py-12 text-center text-gray-400 text-sm">
                {rows.length === 0 ? "No feedback yet." : "No ratings at this level."}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
