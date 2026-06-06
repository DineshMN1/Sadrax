"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Check, X, Loader2, RotateCcw, Package } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { RETURN_REASON_LABELS, RETURN_STATUS_META } from "@/lib/returns";

interface ReturnRow {
  request: {
    id: number;
    orderId: number;
    reason: string;
    description: string | null;
    photos: string[] | null;
    items: { name: string; quantity: number }[] | null;
    status: string;
    resolution: string | null;
    adminNote: string | null;
    createdAt: string;
  };
  orderNumber: string | null;
  orderTotal: number | null;
  paymentMethod: string | null;
  customerName: string | null;
  customerPhone: string | null;
}

type Tab = "pending" | "approved" | "rejected" | "all";

export default function ReturnsPage() {
  const [rows, setRows] = useState<ReturnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("pending");
  const [busy, setBusy] = useState<number | null>(null);

  const fetchRows = async () => {
    const res = await fetch("/api/admin/returns");
    const data = await res.json();
    setRows(data.requests ?? []);
    setLoading(false);
  };
  useEffect(() => { fetchRows(); }, []);

  const decide = async (id: number, status: "approved" | "rejected", resolution?: string) => {
    const adminNote = status === "rejected"
      ? (prompt("Reason for declining (shown to customer):") ?? "")
      : (prompt("Note for customer (optional):") ?? "");
    if (status === "rejected" && adminNote === "") return; // cancelled prompt
    setBusy(id);
    const res = await fetch(`/api/admin/returns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, resolution, adminNote: adminNote || null }),
    });
    setBusy(null);
    if (res.ok) { toast.success(status === "approved" ? "Approved" : "Declined"); fetchRows(); }
    else { const d = await res.json(); toast.error(d.error ?? "Failed"); }
  };

  const filtered = useMemo(() => tab === "all" ? rows : rows.filter(r => r.request.status === tab), [rows, tab]);
  const pendingCount = rows.filter(r => r.request.status === "pending").length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Returns &amp; Refunds</h1>
        <p className="text-sm text-gray-400 mt-0.5">Customer-reported issues on delivered orders.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["pending", "approved", "rejected", "all"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-xl text-sm font-semibold capitalize transition-colors ${tab === t ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {t}{t === "pending" && pendingCount > 0 && <span className="ml-1.5 text-xs">({pendingCount})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400"><Loader2 className="animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-12 text-center text-gray-400 text-sm">
          No {tab === "all" ? "" : tab} requests.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ request: r, orderNumber, orderTotal, paymentMethod, customerName, customerPhone }) => {
            const meta = RETURN_STATUS_META[r.status] ?? RETURN_STATUS_META.pending;
            return (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">#{orderNumber}</span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${meta.tone}`}>{meta.label}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {customerName ?? "—"}{customerPhone ? ` · ${customerPhone}` : ""} · {paymentMethod?.toUpperCase()} · {orderTotal != null ? formatPrice(orderTotal) : ""}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg">{RETURN_REASON_LABELS[r.reason] ?? r.reason}</span>
                </div>

                {r.description && <p className="text-sm text-gray-600">“{r.description}”</p>}

                {r.items && r.items.length > 0 && (
                  <p className="text-xs text-gray-500 flex items-center gap-1.5"><Package size={12} /> {r.items.map(i => `${i.name} ×${i.quantity}`).join(", ")}</p>
                )}

                {r.photos && r.photos.length > 0 && (
                  <div className="flex gap-2">
                    {r.photos.map((p, i) => (
                      <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 relative block">
                        <Image src={p} alt="evidence" fill className="object-cover" sizes="80px" />
                      </a>
                    ))}
                  </div>
                )}

                {r.status === "approved" && (
                  <p className="text-xs text-green-700 font-semibold flex items-center gap-1.5">
                    {r.resolution === "replacement" ? <><RotateCcw size={12} /> Replacement</> : <><Check size={12} /> Refund approved</>}
                  </p>
                )}
                {r.adminNote && <p className="text-xs text-gray-400">Note: {r.adminNote}</p>}

                {r.status === "pending" && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button onClick={() => decide(r.id, "approved", "refund")} disabled={busy === r.id}
                      className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50">
                      <Check size={14} /> Approve refund
                    </button>
                    <button onClick={() => decide(r.id, "approved", "replacement")} disabled={busy === r.id}
                      className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50">
                      <RotateCcw size={14} /> Approve replacement
                    </button>
                    <button onClick={() => decide(r.id, "rejected")} disabled={busy === r.id}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white border border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 disabled:opacity-50">
                      <X size={14} /> Decline
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
