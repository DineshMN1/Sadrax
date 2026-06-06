"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, Eye, EyeOff, Percent, Landmark, Tag } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

interface Cat { id: number; name: string }
interface Offer {
  id: number; title: string; description: string | null; type: string;
  categoryId: number | null; percent: number | null; maxDiscount: number | null;
  minOrder: number | null; bankName: string | null; code: string | null; active: boolean;
}

const TYPES = [
  { value: "cart_percent", label: "% off whole cart", icon: Percent },
  { value: "category_percent", label: "% off a category", icon: Tag },
  { value: "bank", label: "Bank offer (display only)", icon: Landmark },
];

const EMPTY = { title: "", description: "", type: "cart_percent", categoryId: "", percent: "", maxDiscount: "", minOrder: "", bankName: "", code: "" };

export default function PromotionsPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const fetchAll = async () => {
    const [o, c] = await Promise.all([
      fetch("/api/admin/offers").then((r) => r.json()),
      fetch("/api/admin/categories").then((r) => r.json()),
    ]);
    setOffers(o.offers ?? []);
    setCats(c.categories ?? []);
    setLoading(false);
  };
  useEffect(() => { fetchAll(); }, []);

  const set = (k: keyof typeof EMPTY, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const create = async () => {
    if (!form.title) { toast.error("Title required"); return; }
    setSaving(true);
    const payload = {
      title: form.title,
      description: form.description || null,
      type: form.type,
      categoryId: form.type === "category_percent" && form.categoryId ? Number(form.categoryId) : null,
      percent: form.percent ? parseInt(form.percent) : 0,
      maxDiscount: form.maxDiscount ? Math.round(parseFloat(form.maxDiscount) * 100) : null,
      minOrder: form.minOrder ? Math.round(parseFloat(form.minOrder) * 100) : 0,
      bankName: form.type === "bank" ? form.bankName || null : null,
      code: form.code || null,
    };
    const res = await fetch("/api/admin/offers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) { toast.success("Offer created"); setForm(EMPTY); setShowForm(false); fetchAll(); }
    else toast.error((await res.json()).error ?? "Failed");
    setSaving(false);
  };

  const patch = async (id: number, body: Record<string, unknown>) => {
    await fetch(`/api/admin/offers/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    fetchAll();
  };
  const remove = async (id: number) => {
    if (!confirm("Delete this offer?")) return;
    await fetch(`/api/admin/offers/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const desc = (o: Offer) => {
    if (o.type === "bank") return `${o.bankName ?? "Bank"}${o.percent ? ` · ${o.percent}% off` : ""}${o.code ? ` · ${o.code}` : ""}`;
    const where = o.type === "category_percent" ? cats.find((c) => c.id === o.categoryId)?.name ?? "category" : "cart";
    return `${o.percent}% off ${where}${o.minOrder ? ` over ${formatPrice(o.minOrder)}` : ""}${o.maxDiscount ? ` (max ${formatPrice(o.maxDiscount)})` : ""}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
          <p className="text-sm text-gray-400 mt-0.5">Auto-applied offers &amp; bank offers. (Coupon codes live under Offers.)</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700">
          <Plus size={15} /> Add Offer
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="Title *" value={form.title} onChange={(e) => set("title", e.target.value)} className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500" />
            <select value={form.type} onChange={(e) => set("type", e.target.value)} className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none">
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input placeholder="Description" value={form.description} onChange={(e) => set("description", e.target.value)} className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none sm:col-span-2" />
            {form.type === "category_percent" && (
              <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none">
                <option value="">Select category</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            {form.type === "bank" && (
              <input placeholder="Bank name (e.g. HDFC)" value={form.bankName} onChange={(e) => set("bankName", e.target.value)} className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none" />
            )}
            {form.type !== "bank" || form.percent ? (
              <input type="number" placeholder="Percent %" value={form.percent} onChange={(e) => set("percent", e.target.value)} className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none" />
            ) : null}
            {form.type !== "bank" && (
              <>
                <input type="number" placeholder="Min order ₹" value={form.minOrder} onChange={(e) => set("minOrder", e.target.value)} className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none" />
                <input type="number" placeholder="Max discount ₹" value={form.maxDiscount} onChange={(e) => set("maxDiscount", e.target.value)} className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none" />
              </>
            )}
            <input placeholder="Code (optional)" value={form.code} onChange={(e) => set("code", e.target.value)} className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 h-10 border border-gray-200 rounded-xl text-sm text-gray-600">Cancel</button>
            <button onClick={create} disabled={saving} className="flex-1 h-10 bg-green-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">{saving ? "..." : "Create"}</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-400"><Loader2 className="animate-spin mx-auto" /></div>
      ) : (
        <div className="space-y-2.5">
          {offers.map((o) => (
            <div key={o.id} className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${o.type === "bank" ? "bg-indigo-50 text-indigo-600" : "bg-green-50 text-green-600"}`}>
                {o.type === "bank" ? <Landmark size={17} /> : <Percent size={17} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 truncate">{o.title}</p>
                  {!o.active && <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Hidden</span>}
                </div>
                <p className="text-xs text-gray-400 truncate">{desc(o)}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => patch(o.id, { active: !o.active })} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">{o.active ? <Eye size={15} /> : <EyeOff size={15} />}</button>
                <button onClick={() => remove(o.id)} className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
          {offers.length === 0 && <div className="bg-white rounded-2xl border border-gray-100 px-4 py-12 text-center text-gray-400 text-sm">No offers yet</div>}
        </div>
      )}
    </div>
  );
}
