"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Upload, Trash2, AlertTriangle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { toSlug } from "@/lib/utils";

interface Category { id: number; name: string }
interface Product {
  id: number; name: string; slug: string; description: string | null;
  price: number; mrp: number | null; unit: string | null; stock: number;
  categoryId: number | null; images: string[]; active: boolean; featured: boolean;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "", slug: "", description: "", price: "", mrp: "",
    unit: "", stock: "0", categoryId: "", featured: false, active: true,
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/categories").then(r => r.json()),
      fetch(`/api/admin/products/${id}`).then(r => r.json()),
    ]).then(([catData, prodData]) => {
      setCategories(catData.categories ?? []);
      const p: Product = prodData.product;
      if (!p) { toast.error("Product not found"); router.push("/admin/products"); return; }
      setImages(p.images ?? []);
      setForm({
        name: p.name,
        slug: p.slug,
        description: p.description ?? "",
        price: (p.price / 100).toString(),
        mrp: p.mrp ? (p.mrp / 100).toString() : "",
        unit: p.unit ?? "",
        stock: p.stock.toString(),
        categoryId: p.categoryId?.toString() ?? "",
        featured: p.featured,
        active: p.active,
      });
      setLoading(false);
    });
  }, [id, router]);

  const update = (k: string, v: string | boolean) =>
    setForm(p => ({ ...p, [k]: v }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "products");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) setImages(prev => [...prev, data.medium]);
      else toast.error(data.error ?? "Upload failed");
    } finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!form.name || !form.price) { toast.error("Name and price are required"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug || toSlug(form.name),
          description: form.description || null,
          price: Math.round(parseFloat(form.price) * 100),
          mrp: form.mrp ? Math.round(parseFloat(form.mrp) * 100) : null,
          unit: form.unit || null,
          stock: parseInt(form.stock),
          categoryId: form.categoryId ? parseInt(form.categoryId) : null,
          featured: form.featured,
          active: form.active,
          images,
        }),
      });
      const data = await res.json();
      if (res.ok) { toast.success("Product updated!"); router.push("/admin/products"); }
      else toast.error(data.error ?? "Failed to save");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Product deleted"); router.push("/admin/products"); }
      else toast.error("Failed to delete");
    } finally { setDeleting(false); setConfirmDelete(false); }
  };

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50">
            <ChevronLeft size={18} />
          </Link>
          <div className="h-7 w-40 bg-gray-100 rounded-lg animate-pulse" />
        </div>
        {[120, 160, 100].map((h, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className={`bg-gray-100 rounded-lg animate-pulse`} style={{ height: h }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50">
            <ChevronLeft size={18} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
        </div>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-500 text-sm font-semibold rounded-xl hover:bg-red-50 transition-colors">
            <Trash2 size={14} /> Delete
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            <AlertTriangle size={14} className="text-red-500 shrink-0" />
            <span className="text-xs text-red-600 font-medium">Confirm delete?</span>
            <button onClick={handleDelete} disabled={deleting}
              className="text-xs font-bold text-red-600 hover:text-red-700 disabled:opacity-50 ml-1">
              {deleting ? "..." : "Yes"}
            </button>
            <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-500 hover:text-gray-700 ml-0.5">No</button>
          </div>
        )}
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Basic Info</h2>
        {[
          { key: "name", label: "Product Name *", type: "text" },
          { key: "slug", label: "Slug", type: "text" },
          { key: "description", label: "Description", type: "textarea" },
          { key: "unit", label: "Unit (e.g. 500g, 1L, 6 pcs)", type: "text" },
        ].map(({ key, label, type }) => (
          <div key={key}>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">{label}</label>
            {type === "textarea" ? (
              <textarea rows={3} value={(form as Record<string, string | boolean>)[key] as string}
                onChange={e => update(key, e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400/30 resize-none" />
            ) : (
              <input type="text" value={(form as Record<string, string | boolean>)[key] as string}
                onChange={e => {
                  update(key, e.target.value);
                  if (key === "name") update("slug", toSlug(e.target.value));
                }}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400/30" />
            )}
          </div>
        ))}
      </div>

      {/* Pricing & Stock */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Pricing &amp; Stock</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: "price", label: "Price *", rupee: true  },
            { key: "mrp",   label: "MRP",     rupee: true  },
            { key: "stock", label: "Stock (units)", rupee: false },
          ].map(({ key, label, rupee }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">{label}</label>
              <div className="relative">
                {rupee && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500 pointer-events-none">₹</span>
                )}
                <input type="number" min="0" step={key === "stock" ? "1" : "0.01"}
                  value={(form as Record<string, string | boolean>)[key] as string}
                  onChange={e => update(key, e.target.value)}
                  placeholder={rupee ? "0.00" : "0"}
                  className={`w-full h-10 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400/30 ${rupee ? "pl-7 pr-3" : "px-3"}`} />
              </div>
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Category</label>
            <select value={form.categoryId} onChange={e => update("categoryId", e.target.value)}
              className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none">
              <option value="">Uncategorised</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {[
            { key: "active", label: "Active" },
            { key: "featured", label: "Featured / Deal" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={(form as Record<string, string | boolean>)[key] as boolean}
                onChange={e => update(key, e.target.checked)}
                className="w-4 h-4 rounded text-green-600" />
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Images</h2>
        <div className="flex gap-3 flex-wrap">
          {images.map((url, i) => (
            <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
              <Image src={url} alt="" fill className="object-cover" />
              <button onClick={() => setImages(images.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                ×
              </button>
            </div>
          ))}
          <label className={`w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-green-400 transition-colors ${uploading ? "opacity-50" : ""}`}>
            <Upload size={16} className="text-gray-400" />
            <span className="text-[10px] text-gray-400 mt-1">{uploading ? "..." : "Upload"}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link href="/admin/products" className="flex-1 h-11 flex items-center justify-center border border-gray-200 rounded-xl text-sm text-gray-600 font-medium">
          Cancel
        </Link>
        <button onClick={handleSave} disabled={saving}
          className="flex-1 h-11 bg-green-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
