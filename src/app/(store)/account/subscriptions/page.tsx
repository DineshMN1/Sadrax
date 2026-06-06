"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Repeat, Loader2, Pause, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Sub {
  id: number; frequency: string; nextRunAt: string; active: boolean;
  items: { productId: number; quantity: number }[];
}

const FREQ_LABEL: Record<string, string> = { weekly: "Weekly", biweekly: "Every 2 weeks", monthly: "Monthly" };

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch("/api/subscriptions");
    setSubs(res.ok ? (await res.json()).subscriptions ?? [] : []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggle = async (s: Sub) => {
    await fetch("/api/subscriptions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id, active: !s.active }) });
    load();
  };
  const remove = async (id: number) => {
    if (!confirm("Cancel this recurring order?")) return;
    await fetch("/api/subscriptions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    toast.success("Recurring order cancelled");
    load();
  };

  return (
    <div>
      <div className="sticky top-0 z-20 glass border-b border-gray-100/80 px-4 py-3 flex items-center gap-3">
        <Link href="/account" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"><ChevronLeft size={20} className="text-gray-700" /></Link>
        <h1 className="text-lg font-extrabold text-gray-900">Recurring Orders</h1>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="py-16 text-center text-gray-400"><Loader2 className="animate-spin mx-auto" /></div>
        ) : subs.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-4"><Repeat size={28} className="text-green-300" /></div>
            <h3 className="font-bold text-gray-800">No recurring orders</h3>
            <p className="text-sm text-gray-400 mt-1 max-w-xs">Open a past order and tap &quot;Repeat this order&quot; to set one up.</p>
          </div>
        ) : (
          subs.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${s.active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}><Repeat size={18} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">{FREQ_LABEL[s.frequency] ?? s.frequency} · {s.items.length} item{s.items.length !== 1 ? "s" : ""}</p>
                <p className="text-xs text-gray-400">{s.active ? `Next ${formatDistanceToNow(new Date(s.nextRunAt), { addSuffix: true })}` : "Paused"}</p>
              </div>
              <button onClick={() => toggle(s)} className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">{s.active ? <Pause size={15} /> : <Play size={15} />}</button>
              <button onClick={() => remove(s.id)} className="w-9 h-9 flex items-center justify-center text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"><Trash2 size={15} /></button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
