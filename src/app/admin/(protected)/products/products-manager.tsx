"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus, Upload, Search, Minus, Trash2, Loader2, Pencil, Copy,
  Package, PackageX, AlertTriangle, Boxes, X, Layers,
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

interface Product {
  id: number;
  name: string;
  unit: string | null;
  price: number;
  mrp: number | null;
  stock: number;
  active: boolean;
  image: string | null;
  categoryId: number | null;
  categoryName: string | null;
  variantGroup: string | null;
}

interface Cat { id: number; name: string }

type StockFilter = "all" | "in" | "low" | "out";
const LOW_STOCK = 10;

export function ProductsManager({ initialProducts, categories }: { initialProducts: Product[]; categories: Cat[] }) {
  const [items, setItems] = useState<Product[]>(initialProducts);
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all"); // "all" | "none" | category id
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState<Set<number>>(new Set());
  const [stockDraft, setStockDraft] = useState<Record<number, string>>({});

  const setRowBusy = (id: number, on: boolean) =>
    setBusy((s) => { const n = new Set(s); if (on) n.add(id); else n.delete(id); return n; });

  const handleDuplicate = async (p: Product) => {
    setRowBusy(p.id, true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Copy of ${p.name}`,
          price: p.price,
          mrp: p.mrp,
          unit: p.unit,
          stock: 0,
          categoryId: p.categoryId,
          images: p.image ? [p.image] : [],
          active: false,
          variantGroup: p.variantGroup,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const copy: Product = {
        id: data.product.id,
        name: data.product.name,
        unit: data.product.unit,
        price: data.product.price,
        mrp: data.product.mrp,
        stock: data.product.stock ?? 0,
        active: data.product.active,
        image: (data.product.images as string[])[0] ?? null,
        categoryId: data.product.categoryId,
        categoryName: p.categoryName,
        variantGroup: data.product.variantGroup,
      };
      setItems(prev => {
        const idx = prev.findIndex(it => it.id === p.id);
        const next = [...prev];
        next.splice(idx + 1, 0, copy);
        return next;
      });
      toast.success("Duplicated!", {
        action: { label: "Edit →", onClick: () => { window.location.href = `/admin/products/${copy.id}/edit`; } },
      });
    } catch {
      toast.error("Couldn't duplicate");
    } finally {
      setRowBusy(p.id, false);
    }
  };

  // ── Single-product PATCH with optimistic update + rollback ──
  const patchItem = async (id: number, patch: Partial<Product>, payload: Record<string, unknown>) => {
    const prev = items;
    setItems((s) => s.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    setRowBusy(id, true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
    } catch {
      setItems(prev);
      toast.error("Couldn't save change");
    } finally {
      setRowBusy(id, false);
    }
  };

  const setStock = (id: number, stock: number) => {
    const next = Math.max(0, stock);
    setStockDraft((d) => { const n = { ...d }; delete n[id]; return n; });
    const cur = items.find((i) => i.id === id);
    if (cur && cur.stock === next) return;
    patchItem(id, { stock: next }, { stock: next });
  };

  const toggleActive = (p: Product) => patchItem(p.id, { active: !p.active }, { active: !p.active });

  const removeItem = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    const prev = items;
    setItems((s) => s.filter((it) => it.id !== p.id));
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Product deleted");
    } catch {
      setItems(prev);
      toast.error("Couldn't delete");
    }
  };

  // ── Bulk actions over the current selection ──
  const bulkPatch = async (patch: Partial<Product>, payload: Record<string, unknown>, label: string) => {
    const ids = [...selected];
    if (ids.length === 0) return;
    const prev = items;
    setItems((s) => s.map((it) => (selected.has(it.id) ? { ...it, ...patch } : it)));
    setSelected(new Set());
    try {
      await Promise.all(ids.map((id) =>
        fetch(`/api/admin/products/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
          .then((r) => { if (!r.ok) throw new Error(); })
      ));
      toast.success(`${label} ${ids.length} product${ids.length === 1 ? "" : "s"}`);
    } catch {
      setItems(prev);
      toast.error("Some changes failed to save");
    }
  };

  const bulkAssignCategory = (value: string) => {
    const catId = value === "none" ? null : Number(value);
    const cat = categories.find((c) => c.id === catId);
    bulkPatch({ categoryId: catId, categoryName: cat?.name ?? null }, { categoryId: catId }, "Moved");
  };

  const bulkDelete = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} selected product${ids.length === 1 ? "" : "s"}? This cannot be undone.`)) return;
    const prev = items;
    setItems((s) => s.filter((it) => !selected.has(it.id)));
    setSelected(new Set());
    try {
      await Promise.all(ids.map((id) => fetch(`/api/admin/products/${id}`, { method: "DELETE" }).then((r) => { if (!r.ok) throw new Error(); })));
      toast.success(`Deleted ${ids.length} product${ids.length === 1 ? "" : "s"}`);
    } catch {
      setItems(prev);
      toast.error("Some deletions failed");
    }
  };

  // ── Derived: filtered list + inventory stats ──
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((p) => {
      if (needle && !p.name.toLowerCase().includes(needle) && !(p.unit ?? "").toLowerCase().includes(needle)) return false;
      if (catFilter === "none" && p.categoryId !== null) return false;
      if (catFilter !== "all" && catFilter !== "none" && p.categoryId !== Number(catFilter)) return false;
      if (stockFilter === "in" && p.stock <= 0) return false;
      if (stockFilter === "low" && (p.stock === 0 || p.stock > LOW_STOCK)) return false;
      if (stockFilter === "out" && p.stock !== 0) return false;
      return true;
    });
  }, [items, q, catFilter, stockFilter]);

  const stats = useMemo(() => {
    const out = items.filter((p) => p.stock === 0).length;
    const low = items.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK).length;
    const units = items.reduce((s, p) => s + p.stock, 0);
    const value = items.reduce((s, p) => s + p.stock * p.price, 0);
    return { total: items.length, out, low, units, value };
  }, [items]);

  // Group variants together for display
  type DisplayRow =
    | { type: "header"; group: string; count: number }
    | { type: "product"; product: Product; inGroup: boolean };

  const displayRows = useMemo((): DisplayRow[] => {
    const groupMap = new Map<string, Product[]>();
    for (const p of filtered) {
      if (p.variantGroup) {
        const arr = groupMap.get(p.variantGroup) ?? [];
        arr.push(p);
        groupMap.set(p.variantGroup, arr);
      }
    }
    const seen = new Set<string>();
    const result: DisplayRow[] = [];
    for (const p of filtered) {
      if (p.variantGroup) {
        if (seen.has(p.variantGroup)) continue;
        seen.add(p.variantGroup);
        const members = groupMap.get(p.variantGroup)!;
        result.push({ type: "header", group: p.variantGroup, count: members.length });
        for (const m of members) result.push({ type: "product", product: m, inGroup: true });
      } else {
        result.push({ type: "product", product: p, inGroup: false });
      }
    }
    return result;
  }, [filtered]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const toggleSelectAll = () =>
    setSelected((s) => {
      const n = new Set(s);
      if (allVisibleSelected) filtered.forEach((p) => n.delete(p.id));
      else filtered.forEach((p) => n.add(p.id));
      return n;
    });
  const toggleSelect = (id: number) =>
    setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/products/import" className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50">
            <Upload size={15} /> CSV Import
          </Link>
          <Link href="/admin/products/new" className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700">
            <Plus size={15} /> Add Product
          </Link>
        </div>
      </div>

      {/* Inventory summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Package size={18} />} tone="gray" value={stats.total} label="Products" onClick={() => setStockFilter("all")} active={stockFilter === "all"} />
        <StatCard icon={<AlertTriangle size={18} />} tone="amber" value={stats.low} label="Low stock" onClick={() => setStockFilter("low")} active={stockFilter === "low"} />
        <StatCard icon={<PackageX size={18} />} tone="red" value={stats.out} label="Out of stock" onClick={() => setStockFilter("out")} active={stockFilter === "out"} />
        <StatCard icon={<Boxes size={18} />} tone="green" value={stats.units} label={`Units · ${formatPrice(stats.value)} value`} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-50">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products…"
            className="w-full h-10 pl-9 pr-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500"
          />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
          className="h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500">
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          <option value="none">Uncategorized</option>
        </select>
        <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value as StockFilter)}
          className="h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500">
          <option value="all">All stock</option>
          <option value="in">In stock</option>
          <option value="low">Low (≤{LOW_STOCK})</option>
          <option value="out">Out of stock</option>
        </select>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
          <span className="text-sm font-semibold text-green-800">{selected.size} selected</span>
          <select defaultValue="" onChange={(e) => { if (e.target.value) { bulkAssignCategory(e.target.value); e.target.value = ""; } }}
            className="h-8 px-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none">
            <option value="" disabled>Move to category…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            <option value="none">Uncategorized</option>
          </select>
          <button onClick={() => bulkPatch({ active: true }, { active: true }, "Activated")} className="h-8 px-3 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50">Activate</button>
          <button onClick={() => bulkPatch({ active: false }, { active: false }, "Hid")} className="h-8 px-3 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50">Hide</button>
          <button onClick={bulkDelete} className="h-8 px-3 bg-white border border-red-200 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-1"><Trash2 size={12} /> Delete</button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"><X size={12} /> Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-150">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-3 py-3 w-8">
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} className="w-4 h-4 accent-green-600 align-middle" />
              </th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500">Product</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500">Category</th>
              <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500">Price</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500">Stock</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500">Active</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {displayRows.map((row, i) => {
              if (row.type === "header") {
                return (
                  <tr key={`grp-${row.group}`} className="bg-violet-50/50">
                    <td colSpan={7} className="px-4 py-2">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-violet-700">
                        <Layers size={12} className="shrink-0" />
                        <span className="uppercase tracking-wider">{row.group}</span>
                        <span className="font-normal text-violet-400">· {row.count} variants</span>
                      </div>
                    </td>
                  </tr>
                );
              }
              const { product: p, inGroup } = row;
              const saving = busy.has(p.id);
              const draft = stockDraft[p.id];
              return (
                <tr key={p.id} className={`hover:bg-gray-50/50 ${selected.has(p.id) ? "bg-green-50/40" : ""}`}>
                  <td className="px-3 py-3">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="w-4 h-4 accent-green-600 align-middle" />
                  </td>
                  <td className="px-3 py-3">
                    <div className={`flex items-center gap-3 ${inGroup ? "pl-4" : ""}`}>
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                        {p.image
                          ? <Image src={p.image} alt={p.name} width={40} height={40} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-lg">📦</div>}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.unit}{!p.active && <span className="ml-1 text-gray-400">· hidden</span>}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-600">{p.categoryName ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-3 py-3 text-right font-medium whitespace-nowrap">{formatPrice(p.price)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setStock(p.id, p.stock - 1)} disabled={saving || p.stock === 0}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30">
                        <Minus size={13} />
                      </button>
                      <input
                        type="number" min={0}
                        value={draft ?? String(p.stock)}
                        onChange={(e) => setStockDraft((d) => ({ ...d, [p.id]: e.target.value }))}
                        onBlur={() => draft !== undefined && setStock(p.id, parseInt(draft) || 0)}
                        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                        className={`w-14 h-7 text-center text-sm font-semibold rounded-lg border focus:outline-none focus:border-green-500
                          ${p.stock === 0 ? "border-red-200 text-red-600 bg-red-50" : p.stock <= LOW_STOCK ? "border-amber-200 text-amber-700 bg-amber-50" : "border-gray-200 text-gray-900"}`}
                      />
                      <button onClick={() => setStock(p.id, p.stock + 1)} disabled={saving}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30">
                        <Plus size={13} />
                      </button>
                      {saving && <Loader2 size={13} className="animate-spin text-gray-400 ml-0.5" />}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button onClick={() => toggleActive(p)} disabled={saving}
                      className={`relative w-10 h-5 rounded-full transition-colors ${p.active ? "bg-green-500" : "bg-gray-200"} disabled:opacity-50`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${p.active ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleDuplicate(p)} disabled={saving} className="text-gray-300 hover:text-violet-500 transition-colors disabled:opacity-30" title="Duplicate as variant"><Copy size={15} /></button>
                      <Link href={`/admin/products/${p.id}/edit`} className="text-gray-400 hover:text-indigo-600" title="Edit"><Pencil size={15} /></Link>
                      <button onClick={() => removeItem(p)} className="text-red-300 hover:text-red-600" title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                {items.length === 0 ? "No products yet. Add one or import via CSV." : "No products match your filters."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 px-1">Showing {filtered.length} of {items.length} · edit stock inline · <Copy size={10} className="inline" /> duplicates as variant</p>
    </div>
  );
}

function StatCard({ icon, tone, value, label, onClick, active }: {
  icon: React.ReactNode; tone: "gray" | "amber" | "red" | "green"; value: number | string; label: string;
  onClick?: () => void; active?: boolean;
}) {
  const tones: Record<string, string> = {
    gray: "bg-gray-50 text-gray-600", amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600", green: "bg-green-50 text-green-600",
  };
  return (
    <button onClick={onClick} disabled={!onClick}
      className={`text-left bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-3 transition-colors ${active ? "border-green-300 ring-1 ring-green-200" : "border-gray-100"} ${onClick ? "hover:border-gray-200 cursor-pointer" : "cursor-default"}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tones[tone]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-400 mt-1 truncate">{label}</p>
      </div>
    </button>
  );
}
