"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Tag, Percent, IndianRupee, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

interface Coupon {
  id: number;
  code: string;
  type: "flat" | "percent";
  value: number;
  minOrder: number;
  maxDiscount?: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  active: boolean;
}

export default function OffersPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "", type: "flat" as "flat" | "percent",
    value: "", minOrder: "", maxDiscount: "", maxUses: "", expiresAt: "",
  });

  const fetchCoupons = async () => {
    const res = await fetch("/api/admin/coupons");
    const data = await res.json();
    setCoupons(data.coupons ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleCreate = async () => {
    if (!form.code || !form.value) { toast.error("Code and value are required"); return; }
    setSaving(true);
    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        type: form.type,
        value: form.type === "flat"
          ? Math.round(parseFloat(form.value) * 100)
          : parseInt(form.value),
        minOrder: form.minOrder ? Math.round(parseFloat(form.minOrder) * 100) : 0,
        maxDiscount: form.maxDiscount ? Math.round(parseFloat(form.maxDiscount) * 100) : null,
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
        expiresAt: form.expiresAt || null,
      };
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
      toast.success("Coupon created!");
      setShowForm(false);
      setForm({ code: "", type: "flat", value: "", minOrder: "", maxDiscount: "", maxUses: "", expiresAt: "" });
      fetchCoupons();
    } finally { setSaving(false); }
  };

  const handleToggle = async (id: number, active: boolean) => {
    await fetch(`/api/admin/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    fetchCoupons();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this coupon?")) return;
    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    fetchCoupons();
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offers &amp; Coupons</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create discount codes for your customers</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700">
          <Plus size={15} /> New Coupon
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
          <h2 className="font-semibold text-gray-900">New Coupon</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Code *</label>
              <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="SAVE50" className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono uppercase focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as "flat" | "percent" }))}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none">
                <option value="flat">Flat (₹)</option>
                <option value="percent">Percent (%)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                {form.type === "flat" ? "Discount ₹ *" : "Discount % *"}
              </label>
              <input type="number" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
                placeholder={form.type === "flat" ? "50" : "10"} className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Min Order ₹</label>
              <input type="number" value={form.minOrder} onChange={e => setForm(p => ({ ...p, minOrder: e.target.value }))}
                placeholder="200" className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none" />
            </div>
            {form.type === "percent" && (
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Max Discount ₹</label>
                <input type="number" value={form.maxDiscount} onChange={e => setForm(p => ({ ...p, maxDiscount: e.target.value }))}
                  placeholder="100" className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none" />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Max Uses</label>
              <input type="number" value={form.maxUses} onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))}
                placeholder="Unlimited" className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Expires At</label>
              <input type="datetime-local" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 h-10 border border-gray-200 rounded-xl text-sm text-gray-600">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="flex-1 h-10 bg-green-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
              {saving ? "Creating…" : "Create Coupon"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-10 flex justify-center"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : coupons.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No coupons yet. Create your first offer!</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {coupons.map((c) => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                  {c.type === "percent" ? <Percent size={18} className="text-green-600" /> : <IndianRupee size={18} className="text-green-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 font-mono">{c.code}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${c.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {c.active ? "ACTIVE" : "OFF"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {c.type === "flat" ? `₹${c.value / 100} off` : `${c.value}% off`}
                    {c.minOrder ? ` · min ₹${c.minOrder / 100}` : ""}
                    {c.maxUses ? ` · ${c.usedCount}/${c.maxUses} used` : ` · ${c.usedCount} used`}
                    {c.expiresAt ? ` · expires ${new Date(c.expiresAt).toLocaleDateString("en-IN")}` : ""}
                  </p>
                </div>
                <button onClick={() => handleToggle(c.id, c.active)} className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${c.active ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-700"}`}>
                  {c.active ? "Disable" : "Enable"}
                </button>
                <button onClick={() => handleDelete(c.id)} className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
