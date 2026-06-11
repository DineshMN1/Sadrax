"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Clock, Package, Check, X } from "lucide-react";
import { LottiePlayer } from "@/components/lottie-player";
import loadingAnim from "@/lottie/loading.json";
import { formatDistanceToNow } from "date-fns";

interface RequestRow {
  id: number;
  productName: string;
  note: string | null;
  status: string;
  createdAt: string;
  userName: string | null;
  userPhone: string | null;
  userEmail: string | null;
}

type Tab = "pending" | "added" | "declined" | "all";

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:  { label: "Pending",  color: "bg-amber-50 text-amber-700 border-amber-200"  },
  added:    { label: "Added ✓",  color: "bg-green-50 text-green-700 border-green-200"  },
  declined: { label: "Declined", color: "bg-red-50   text-red-700   border-red-200"    },
};

export default function ProductRequestsAdminPage() {
  const [rows, setRows]       = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<Tab>("pending");
  const [busy, setBusy]       = useState<number | null>(null);

  const fetchRows = async () => {
    const res  = await fetch("/api/admin/product-requests");
    const data = await res.json();
    setRows(data.requests ?? []);
    setLoading(false);
  };
  useEffect(() => { fetchRows(); }, []);

  const updateStatus = async (id: number, status: "added" | "declined") => {
    setBusy(id);
    const res = await fetch(`/api/admin/product-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    if (res.ok) {
      toast.success(status === "added" ? "Marked as added" : "Declined");
      fetchRows();
    } else {
      toast.error("Failed to update");
    }
  };

  const filtered  = useMemo(() => tab === "all" ? rows : rows.filter(r => r.status === tab), [rows, tab]);
  const pendingCount = rows.filter(r => r.status === "pending").length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Product Requests</h1>
        <p className="text-sm text-gray-400 mt-0.5">Products customers couldn&apos;t find in the store.</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(["pending", "added", "declined", "all"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-xl text-sm font-semibold capitalize transition-colors ${tab === t ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            {t}{t === "pending" && pendingCount > 0 && <span className="ml-1.5 text-xs">({pendingCount})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-4 flex justify-center">
          <LottiePlayer animationData={loadingAnim} loop className="w-28 h-28" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-12 text-center text-gray-400 text-sm">
          No {tab === "all" ? "" : tab} requests.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const meta = STATUS_META[r.status] ?? STATUS_META.pending;
            return (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                      <Package size={16} className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{r.productName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {r.userName ?? "—"}{r.userPhone ? ` · ${r.userPhone}` : ""}{r.userEmail ? ` · ${r.userEmail}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${meta.color}`}>
                    {meta.label}
                  </span>
                </div>

                {r.note && (
                  <p className="text-sm text-gray-600 ml-11">&ldquo;{r.note}&rdquo;</p>
                )}

                <p className="text-[11px] text-gray-400 flex items-center gap-1 ml-11">
                  <Clock size={10} />
                  {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                </p>

                {r.status === "pending" && (
                  <div className="flex gap-2 ml-11 pt-1">
                    <button
                      onClick={() => updateStatus(r.id, "added")}
                      disabled={busy === r.id}
                      className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-xs font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <Check size={13} /> Mark as Added
                    </button>
                    <button
                      onClick={() => updateStatus(r.id, "declined")}
                      disabled={busy === r.id}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white border border-red-200 text-red-600 text-xs font-semibold rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      <X size={13} /> Decline
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
