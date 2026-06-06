"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, Truck, PackagePlus, Building2 } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

interface Supplier { id: number; name: string; phone: string | null; active: boolean }
interface Prod { id: number; name: string; stock: number }
interface Purchase { id: number; quantity: number; costPrice: number | null; productName: string | null; supplierName: string | null; createdAt: string }

export default function InventoryPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Prod[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [sup, setSup] = useState({ name: "", phone: "" });
  const [buy, setBuy] = useState({ productId: "", supplierId: "", quantity: "", costPrice: "" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [s, p, pu] = await Promise.all([
      fetch("/api/admin/suppliers").then((r) => r.json()),
      fetch("/api/admin/products").then((r) => r.json()),
      fetch("/api/admin/purchases").then((r) => r.json()),
    ]);
    setSuppliers(s.suppliers ?? []);
    setProducts((p.products ?? []).map((x: { product: Prod }) => x.product));
    setPurchases(pu.purchases ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const addSupplier = async () => {
    if (!sup.name) { toast.error("Name required"); return; }
    setBusy(true);
    const res = await fetch("/api/admin/suppliers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sup) });
    if (res.ok) { toast.success("Supplier added"); setSup({ name: "", phone: "" }); load(); }
    else toast.error("Failed");
    setBusy(false);
  };
  const delSupplier = async (id: number) => {
    if (!confirm("Delete supplier?")) return;
    await fetch(`/api/admin/suppliers/${id}`, { method: "DELETE" }); load();
  };

  const recordStockIn = async () => {
    if (!buy.productId || !buy.quantity) { toast.error("Pick a product and quantity"); return; }
    setBusy(true);
    const res = await fetch("/api/admin/purchases", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: Number(buy.productId),
        supplierId: buy.supplierId ? Number(buy.supplierId) : null,
        quantity: Number(buy.quantity),
        costPrice: buy.costPrice ? Number(buy.costPrice) : null,
      }),
    });
    if (res.ok) { toast.success("Stock added"); setBuy({ productId: "", supplierId: "", quantity: "", costPrice: "" }); load(); }
    else toast.error((await res.json()).error ?? "Failed");
    setBusy(false);
  };

  const input = "h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500";

  return (
    <div className="space-y-5 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>

      {/* Stock-in */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2"><PackagePlus size={16} className="text-green-600" /><h2 className="font-semibold text-gray-900">Record stock-in</h2></div>
        <div className="grid sm:grid-cols-2 gap-3">
          <select value={buy.productId} onChange={(e) => setBuy((p) => ({ ...p, productId: e.target.value }))} className={input}>
            <option value="">Select product *</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name} (stock {p.stock})</option>)}
          </select>
          <select value={buy.supplierId} onChange={(e) => setBuy((p) => ({ ...p, supplierId: e.target.value }))} className={input}>
            <option value="">Supplier (optional)</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="number" placeholder="Quantity *" value={buy.quantity} onChange={(e) => setBuy((p) => ({ ...p, quantity: e.target.value }))} className={input} />
          <input type="number" step="0.01" placeholder="Cost / unit ₹ (optional)" value={buy.costPrice} onChange={(e) => setBuy((p) => ({ ...p, costPrice: e.target.value }))} className={input} />
        </div>
        <button onClick={recordStockIn} disabled={busy} className="h-10 px-4 flex items-center gap-1.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Add stock
        </button>
      </div>

      {/* Suppliers */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2"><Building2 size={16} className="text-indigo-600" /><h2 className="font-semibold text-gray-900">Suppliers</h2></div>
        <div className="flex flex-wrap gap-2">
          <input placeholder="Name" value={sup.name} onChange={(e) => setSup((p) => ({ ...p, name: e.target.value }))} className={`${input} flex-1 min-w-40`} />
          <input placeholder="Phone" value={sup.phone} onChange={(e) => setSup((p) => ({ ...p, phone: e.target.value }))} className={`${input} flex-1 min-w-40`} />
          <button onClick={addSupplier} disabled={busy} className="h-10 px-4 flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50"><Plus size={15} /> Add</button>
        </div>
        <div className="divide-y divide-gray-50">
          {suppliers.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-2.5">
              <div><p className="text-sm font-semibold text-gray-900">{s.name}</p>{s.phone && <p className="text-xs text-gray-400">{s.phone}</p>}</div>
              <button onClick={() => delSupplier(s.id)} className="text-red-400 hover:text-red-600"><Trash2 size={15} /></button>
            </div>
          ))}
          {suppliers.length === 0 && <p className="py-3 text-sm text-gray-400 text-center">No suppliers yet</p>}
        </div>
      </div>

      {/* Recent purchases */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3"><Truck size={16} className="text-gray-600" /><h2 className="font-semibold text-gray-900">Recent stock-ins</h2></div>
        {loading ? <div className="py-6 text-center text-gray-400"><Loader2 className="animate-spin mx-auto" /></div> : (
          <div className="divide-y divide-gray-50">
            {purchases.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium text-gray-800">{p.productName} <span className="text-green-600 font-bold">+{p.quantity}</span></p>
                  <p className="text-xs text-gray-400">{p.supplierName ?? "—"} · {new Date(p.createdAt).toLocaleDateString("en-IN")}</p>
                </div>
                {p.costPrice != null && <span className="text-xs text-gray-500">{formatPrice(p.costPrice)}/unit</span>}
              </div>
            ))}
            {purchases.length === 0 && <p className="py-3 text-sm text-gray-400 text-center">No stock-ins recorded yet</p>}
          </div>
        )}
      </div>
    </div>
  );
}
