"use client";

import { useState } from "react";
import { Search, Plus, Minus, Trash2, X, Loader2, RotateCcw } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

interface EditItem {
  productId: number | null;
  productName: string;
  productUnit?: string | null;
  price: number;
  quantity: number;
}
interface Line {
  productId: number;
  name: string;
  unit?: string | null;
  price: number;
  quantity: number;
  original: number; // qty before this edit (0 = newly added)
}
interface SearchResult { id: number; name: string; unit?: string | null; price: number; stock: number }

export function OrderEditSheet({
  orderId,
  orderNumber,
  items,
  onClose,
  onSaved,
}: {
  orderId: number;
  orderNumber: string;
  items: EditItem[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [lines, setLines] = useState<Line[]>(
    items
      .filter(i => i.productId != null)
      .map(i => ({ productId: i.productId!, name: i.productName, unit: i.productUnit, price: i.price, quantity: i.quantity, original: i.quantity })),
  );
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const setQty = (pid: number, qty: number) =>
    setLines(ls => ls.map(l => (l.productId === pid ? { ...l, quantity: Math.max(0, qty) } : l)));

  const addProduct = (p: SearchResult) =>
    setLines(ls => {
      const ex = ls.find(l => l.productId === p.id);
      if (ex) return ls.map(l => (l.productId === p.id ? { ...l, quantity: l.quantity + 1 } : l));
      return [...ls, { productId: p.id, name: p.name, unit: p.unit, price: p.price, quantity: 1, original: 0 }];
    });

  const search = async (term: string) => {
    setQ(term);
    if (term.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const r = await fetch(`/api/products?q=${encodeURIComponent(term)}&limit=8`);
      const d = await r.json();
      setResults(d.products ?? []);
    } catch { /* ignore */ } finally { setSearching(false); }
  };

  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const changed = lines.some(l => l.quantity !== l.original);

  const save = async () => {
    const finalItems = lines.filter(l => l.quantity > 0).map(l => ({ productId: l.productId, quantity: l.quantity }));
    if (finalItems.length === 0) { toast.error("Keep at least one item, or reject the order instead."); return; }
    setSaving(true);
    try {
      const r = await fetch(`/api/cord/orders/${orderId}/items`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: finalItems }),
      });
      const d = await r.json();
      if (r.ok) { toast.success("Order updated — customer notified"); onSaved(); }
      else toast.error(d.error ?? "Couldn't update the order");
    } catch { toast.error("Network error — please try again"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[88vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-gray-900">Edit order</h3>
            <p className="text-xs text-gray-400">#{orderNumber}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"><X size={18} className="text-gray-400" /></button>
        </div>

        {/* lines */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {lines.map(l => {
            const removed = l.quantity === 0;
            const isNew = l.original === 0;
            return (
              <div key={l.productId} className={`flex items-center gap-2 rounded-xl border p-2.5 ${removed ? "bg-gray-50 border-gray-100" : isNew ? "bg-green-50 border-green-200" : "border-gray-100"}`}>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${removed ? "line-through text-gray-400" : "text-gray-900"}`}>
                    {l.name}
                    {isNew && !removed && <span className="ml-1.5 text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">NEW</span>}
                  </p>
                  <p className="text-xs text-gray-400">{l.unit ? l.unit + " · " : ""}{formatPrice(l.price)}</p>
                </div>
                {removed ? (
                  <button onClick={() => setQty(l.productId, l.original || 1)} className="flex items-center gap-1 text-xs font-bold text-green-600 px-2 h-8"><RotateCcw size={13} /> Undo</button>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-1 h-9">
                      <button onClick={() => setQty(l.productId, l.quantity - 1)} className="w-7 h-7 flex items-center justify-center rounded-md text-gray-700 hover:bg-white active:scale-90 transition"><Minus size={15} strokeWidth={2.5} /></button>
                      <span className="text-sm font-extrabold text-gray-900 w-6 text-center tabular-nums">{l.quantity}</span>
                      <button onClick={() => setQty(l.productId, l.quantity + 1)} className="w-7 h-7 flex items-center justify-center rounded-md text-gray-700 hover:bg-white active:scale-90 transition"><Plus size={15} strokeWidth={2.5} /></button>
                    </div>
                    <button onClick={() => setQty(l.productId, 0)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                  </div>
                )}
              </div>
            );
          })}

          {/* add item */}
          <div className="pt-2">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 h-10">
              <Search size={15} className="text-gray-400 shrink-0" />
              <input value={q} onChange={e => search(e.target.value)} placeholder="Add an item…" className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400" />
              {searching && <Loader2 size={14} className="animate-spin text-gray-400" />}
            </div>
            {results.length > 0 && (
              <div className="mt-1 border border-gray-100 rounded-xl divide-y divide-gray-50 max-h-44 overflow-y-auto">
                {results.map(p => (
                  <button key={p.id} onClick={() => { addProduct(p); setQ(""); setResults([]); }} disabled={p.stock <= 0}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-left">
                    <span className="text-sm text-gray-800 truncate">{p.name} {p.unit && <span className="text-xs text-gray-400">{p.unit}</span>}</span>
                    <span className="text-sm font-semibold text-gray-600 shrink-0 ml-2">{formatPrice(p.price)}{p.stock <= 0 && <span className="text-red-400"> · OOS</span>}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* footer */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-500">New subtotal</span><span className="font-extrabold text-gray-900">{formatPrice(subtotal)}</span></div>
          <p className="text-[11px] text-gray-400">Delivery &amp; total are recalculated on save. The customer gets a notification.</p>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600">Cancel</button>
            <button onClick={save} disabled={saving || !changed} className="flex-1 h-11 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <Loader2 size={15} className="animate-spin" />}{saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
