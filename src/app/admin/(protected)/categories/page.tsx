"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Plus, Upload, Trash2, Pencil, X, Check, GripVertical, Eye, EyeOff, Loader2 } from "lucide-react";
import { LottiePlayer } from "@/components/lottie-player";
import loadingAnim from "@/lottie/loading.json";
import { toast } from "sonner";
import { toSlug } from "@/lib/utils";
import { getCategoryEmoji } from "@/lib/category-emoji";

interface Category {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
  order: number;
  active: boolean;
  productCount: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", slug: "" });
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);

  const fetchCategories = async () => {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCategories(data.categories ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, categoryId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(categoryId);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "categories");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) {
      await fetch(`/api/admin/categories/${categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: data.medium }),
      });
      fetchCategories();
    } else toast.error(data.error ?? "Upload failed");
    setUploading(null);
  };

  const handleCreate = async () => {
    if (!form.name) { toast.error("Name required"); return; }
    setSaving(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, slug: form.slug || toSlug(form.name), order: categories.length }),
    });
    if (res.ok) { toast.success("Category created"); setShowForm(false); setForm({ name: "", slug: "" }); fetchCategories(); }
    else { const d = await res.json(); toast.error(d.error ?? "Failed"); }
    setSaving(false);
  };

  const patchCategory = async (id: number, body: Record<string, unknown>) => {
    await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    fetchCategories();
  };

  const handleDelete = async (cat: Category) => {
    if (cat.productCount > 0) {
      toast.error(`Move or remove the ${cat.productCount} product(s) first`);
      return;
    }
    if (!confirm(`Delete "${cat.name}"?`)) return;
    await fetch(`/api/admin/categories/${cat.id}`, { method: "DELETE" });
    fetchCategories();
  };

  const handleReorder = async (reordered: Category[]) => {
    setCategories(reordered.map((c, i) => ({ ...c, order: i })));
    const res = await fetch("/api/admin/categories/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map(c => c.id) }),
    });
    if (!res.ok) { toast.error("Failed to save order"); fetchCategories(); }
    else toast.success("Order saved");
  };

  const onDrop = (toIdx: number) => {
    if (dragIdx === null || dragIdx === toIdx) return;
    const reordered = [...sorted];
    const [item] = reordered.splice(dragIdx, 1);
    reordered.splice(toIdx, 0, item);
    setDragIdx(null);
    setDropIdx(null);
    handleReorder(reordered);
  };

  const startEdit = (cat: Category) => { setEditingId(cat.id); setEditForm({ name: cat.name, slug: cat.slug }); };
  const handleEditSave = async (id: number) => {
    setSaving(true);
    await patchCategory(id, { name: editForm.name, slug: editForm.slug });
    setEditingId(null);
    setSaving(false);
    toast.success("Category updated");
  };

  const move = async (cat: Category, dir: -1 | 1) => {
    const sorted = [...categories].sort((a, b) => a.order - b.order || a.id - b.id);
    const idx = sorted.findIndex(c => c.id === cat.id);
    const swap = sorted[idx + dir];
    if (!swap) return;
    await Promise.all([
      fetch(`/api/admin/categories/${cat.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: swap.order }) }),
      fetch(`/api/admin/categories/${swap.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: cat.order }) }),
    ]);
    fetchCategories();
  };

  const sorted = [...categories].sort((a, b) => a.order - b.order || a.id - b.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-400 mt-0.5">{categories.length} total · order controls how they appear in the store</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700">
          <Plus size={15} /> Add Category
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
          <h2 className="font-semibold text-gray-900">New Category</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="Name *" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value, slug: p.slug || toSlug(e.target.value) }))}
              className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500" />
            <input placeholder="Slug" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
              className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-green-500" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 h-10 border border-gray-200 rounded-xl text-sm text-gray-600">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="flex-1 h-10 bg-green-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
              {saving ? "..." : "Create"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-4 flex justify-center"><LottiePlayer animationData={loadingAnim} loop className="w-28 h-28" /></div>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((cat, i) => (
            <div
              key={cat.id}
              draggable
              onDragStart={() => setDragIdx(i)}
              onDragOver={(e) => { e.preventDefault(); setDropIdx(i); }}
              onDrop={() => onDrop(i)}
              onDragEnd={() => { setDragIdx(null); setDropIdx(null); }}
              className={`flex items-center gap-3 bg-white rounded-2xl border shadow-sm p-3 transition-all select-none ${
                dragIdx === i
                  ? "opacity-40 scale-[0.98] border-gray-200"
                  : dropIdx === i && dragIdx !== i
                  ? "border-green-400 bg-green-50/50 shadow-green-100"
                  : "border-gray-100"
              }`}
            >
              {/* Reorder — drag handle + ▲▼ fallback */}
              <div className="flex flex-col items-center text-gray-300 cursor-grab active:cursor-grabbing shrink-0">
                <button onClick={() => move(cat, -1)} disabled={i === 0} className="hover:text-gray-600 disabled:opacity-20 leading-none text-xs">▲</button>
                <GripVertical size={14} className="my-0.5 hover:text-gray-500 transition-colors" />
                <button onClick={() => move(cat, 1)} disabled={i === sorted.length - 1} className="hover:text-gray-600 disabled:opacity-20 leading-none text-xs">▼</button>
              </div>

              {/* Image */}
              <label className="relative cursor-pointer shrink-0 group">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center">
                  {uploading === cat.id
                    ? <Loader2 size={16} className="animate-spin text-gray-400" />
                    : cat.image
                      ? <Image src={cat.image} alt={cat.name} width={56} height={56} className="w-full h-full object-cover" />
                      : <span className="text-2xl">{getCategoryEmoji(cat.slug)}</span>}
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors rounded-xl">
                  <Upload size={14} className="text-white opacity-0 group-hover:opacity-100" />
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, cat.id)} disabled={uploading === cat.id} />
              </label>

              {/* Info / edit */}
              <div className="flex-1 min-w-0">
                {editingId === cat.id ? (
                  <div className="flex flex-wrap gap-2">
                    <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                      className="h-8 px-2 bg-gray-50 border border-gray-200 rounded-lg text-sm flex-1 min-w-30 focus:outline-none focus:border-green-500" />
                    <input value={editForm.slug} onChange={e => setEditForm(p => ({ ...p, slug: e.target.value }))}
                      className="h-8 px-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono flex-1 min-w-30 focus:outline-none focus:border-green-500" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 truncate">{cat.name}</p>
                      {!cat.active && <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Hidden</span>}
                    </div>
                    <p className="text-xs text-gray-400 font-mono">{cat.slug}</p>
                    <p className={`text-[11px] mt-0.5 font-medium ${cat.productCount === 0 ? "text-amber-500" : "text-gray-400"}`}>
                      {cat.productCount} product{cat.productCount === 1 ? "" : "s"}{cat.productCount === 0 ? " · empty" : ""}
                    </p>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {editingId === cat.id ? (
                  <>
                    <button onClick={() => handleEditSave(cat.id)} disabled={saving} className="w-8 h-8 flex items-center justify-center bg-green-600 text-white rounded-lg hover:bg-green-700"><Check size={14} /></button>
                    <button onClick={() => setEditingId(null)} className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"><X size={14} /></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => patchCategory(cat.id, { active: !cat.active })} title={cat.active ? "Hide from store" : "Show in store"}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                      {cat.active ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button onClick={() => startEdit(cat)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(cat)} className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"><Trash2 size={15} /></button>
                  </>
                )}
              </div>
            </div>
          ))}
          {sorted.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 px-4 py-12 text-center text-gray-400 text-sm">No categories yet</div>
          )}
        </div>
      )}
    </div>
  );
}
