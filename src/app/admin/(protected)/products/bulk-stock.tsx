"use client";

import { useState } from "react";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Product { id: number; name: string; stock: number }

export function BulkStockEditor({ products }: { products: Product[] }) {
  const [active, setActive]   = useState(false);
  const [stocks, setStocks]   = useState<Record<number, string>>({});
  const [saving, setSaving]   = useState(false);

  const init = () => {
    const m: Record<number, string> = {};
    products.forEach(p => { m[p.id] = String(p.stock); });
    setStocks(m);
    setActive(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(stocks)
        .map(([id, val]) => ({ id: Number(id), stock: Math.max(0, parseInt(val) || 0) }))
        .filter(u => {
          const orig = products.find(p => p.id === u.id);
          return orig && u.stock !== orig.stock;
        });

      if (updates.length === 0) { toast.success("No changes to save"); setActive(false); return; }

      const res = await fetch("/api/admin/products/bulk-stock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      if (res.ok) {
        toast.success(`Updated stock for ${updates.length} product${updates.length !== 1 ? "s" : ""}`);
        setActive(false);
        window.location.reload();
      } else {
        toast.error("Failed to save");
      }
    } finally {
      setSaving(false);
    }
  };

  if (!active) {
    return (
      <button onClick={init}
        className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
        <Pencil size={14} /> Quick Stock Edit
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-xl">
        Editing stock — edit values in the table, then save
      </span>
      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors">
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        Save All
      </button>
      <button onClick={() => setActive(false)}
        className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
        <X size={14} /> Cancel
      </button>
    </div>
  );
}

export function StockCell({ productId, stock, isEditing, onStockChange }:
  { productId: number; stock: number; isEditing: boolean; onStockChange: (id: number, val: string) => void }) {

  if (!isEditing) {
    return (
      <span className={`font-semibold ${stock === 0 ? "text-red-500" : stock <= 10 ? "text-yellow-600" : "text-gray-900"}`}>
        {stock}
      </span>
    );
  }

  return (
    <input
      type="number"
      min="0"
      defaultValue={stock}
      onChange={e => onStockChange(productId, e.target.value)}
      className="w-20 h-8 px-2 text-sm font-semibold text-center bg-yellow-50 border-2 border-yellow-400 rounded-lg focus:outline-none focus:border-yellow-500"
    />
  );
}
