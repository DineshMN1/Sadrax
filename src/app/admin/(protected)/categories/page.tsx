"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Plus, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { toSlug } from "@/lib/utils";

interface Category { id: number; name: string; slug: string; image?: string; order: number; active: boolean }

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", order: "0" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<number | "new">(0);

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
    }
    setUploading(0);
  };

  const handleCreate = async () => {
    if (!form.name) { toast.error("Name required"); return; }
    setSaving(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, slug: form.slug || toSlug(form.name), order: parseInt(form.order) }),
    });
    if (res.ok) { toast.success("Category created"); setShowForm(false); setForm({ name: "", slug: "", order: "0" }); fetchCategories(); }
    else { const d = await res.json(); toast.error(d.error ?? "Failed"); }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this category?")) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    fetchCategories();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700">
          <Plus size={15} /> Add Category
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <h2 className="font-semibold text-gray-900">New Category</h2>
          <div className="grid grid-cols-3 gap-3">
            <input placeholder="Name *" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value, slug: p.slug || toSlug(e.target.value) }))}
              className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none" />
            <input placeholder="Slug" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
              className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none" />
            <input type="number" placeholder="Order" value={form.order} onChange={(e) => setForm((p) => ({ ...p, order: e.target.value }))}
              className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 h-10 border border-gray-200 rounded-xl text-sm text-gray-600">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="flex-1 h-10 bg-green-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
              {saving ? "..." : "Create"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Category</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Slug</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Order</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Image</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-semibold text-gray-900">{cat.name}</td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{cat.slug}</td>
                <td className="px-4 py-3 text-center text-gray-600">{cat.order}</td>
                <td className="px-4 py-3 text-center">
                  <label className="relative cursor-pointer inline-block">
                    {cat.image ? (
                      <Image src={cat.image} alt={cat.name} width={32} height={32} className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200">
                        <Upload size={12} />
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, cat.id)} disabled={uploading === cat.id} />
                  </label>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(cat.id)} className="text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && !loading && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-sm">No categories yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
