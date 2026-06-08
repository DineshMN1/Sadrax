"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, Eye, EyeOff, Bike, Phone } from "lucide-react";
import { LottiePlayer } from "@/components/lottie-player";
import loadingAnim from "@/lottie/loading.json";
import { toast } from "sonner";

interface Rider { id: number; name: string; phone: string; active: boolean }

export default function RidersPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [saving, setSaving] = useState(false);

  const fetchRiders = async () => {
    const res = await fetch("/api/admin/riders");
    setRiders((await res.json()).riders ?? []);
    setLoading(false);
  };
  useEffect(() => { fetchRiders(); }, []);

  const create = async () => {
    if (!form.name || !form.phone) { toast.error("Name and phone required"); return; }
    setSaving(true);
    const res = await fetch("/api/admin/riders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { toast.success("Rider added"); setForm({ name: "", phone: "" }); fetchRiders(); }
    else toast.error((await res.json()).error ?? "Failed");
    setSaving(false);
  };
  const patch = async (id: number, body: Record<string, unknown>) => {
    await fetch(`/api/admin/riders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    fetchRiders();
  };
  const remove = async (id: number) => {
    if (!confirm("Remove this rider?")) return;
    await fetch(`/api/admin/riders/${id}`, { method: "DELETE" });
    fetchRiders();
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Delivery Riders</h1>
        <p className="text-sm text-gray-400 mt-0.5">Add riders, then assign them to orders from the Cord panel.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-wrap gap-2">
        <input placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm flex-1 min-w-40 focus:outline-none focus:border-green-500" />
        <input placeholder="Phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm flex-1 min-w-40 focus:outline-none focus:border-green-500" />
        <button onClick={create} disabled={saving} className="h-10 px-4 flex items-center gap-1.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50">
          <Plus size={15} /> Add
        </button>
      </div>

      {loading ? (
        <div className="py-4 flex justify-center"><LottiePlayer animationData={loadingAnim} loop className="w-28 h-28" /></div>
      ) : (
        <div className="space-y-2.5">
          {riders.map((r) => (
            <div key={r.id} className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0"><Bike size={18} /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">{r.name}</p>
                  {!r.active && <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Inactive</span>}
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-1"><Phone size={11} /> {r.phone}</p>
              </div>
              <button onClick={() => patch(r.id, { active: !r.active })} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">{r.active ? <Eye size={15} /> : <EyeOff size={15} />}</button>
              <button onClick={() => remove(r.id)} className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"><Trash2 size={15} /></button>
            </div>
          ))}
          {riders.length === 0 && <div className="bg-white rounded-2xl border border-gray-100 px-4 py-12 text-center text-gray-400 text-sm">No riders yet</div>}
        </div>
      )}
    </div>
  );
}
