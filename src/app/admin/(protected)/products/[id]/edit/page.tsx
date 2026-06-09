"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Upload, Trash2, AlertTriangle, Plus, Save, Loader2, ImagePlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { toSlug } from "@/lib/utils";

interface Category { id: number; name: string }

type Variant = { unit: string; price: string; mrp: string; stock: string; image: string };

interface Product {
  id: number; name: string; slug: string; description: string | null;
  price: number; mrp: number | null; unit: string | null; stock: number;
  categoryId: number | null; images: string[]; active: boolean; featured: boolean;
  brand: string | null; veg: string | null;
  variants: { unit: string; price: number; mrp: number | null; stock: number; image?: string | null }[];
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [categories, setCategories]           = useState<Category[]>([]);
  const [uploading, setUploading]             = useState(false);
  const [uploadingIdx, setUploadingIdx]       = useState<number | null>(null);
  const [saving, setSaving]                   = useState(false);
  const [deleting, setDeleting]               = useState(false);
  const [confirmDelete, setConfirmDelete]     = useState(false);
  const [images, setImages]                   = useState<string[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [form, setForm] = useState({
    name: "", slug: "", description: "", price: "", mrp: "",
    unit: "", stock: "0", categoryId: "", brand: "", veg: "", featured: false, active: true,
  });

  const [variantRows, setVariantRows] = useState<Variant[]>([]);

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
        name: p.name, slug: p.slug, description: p.description ?? "",
        price: (p.price / 100).toString(), mrp: p.mrp ? (p.mrp / 100).toString() : "",
        unit: p.unit ?? "", stock: p.stock.toString(),
        categoryId: p.categoryId?.toString() ?? "", brand: p.brand ?? "",
        veg: p.veg ?? "", featured: p.featured, active: p.active,
      });
      setVariantRows((p.variants ?? []).map(v => ({
        unit: v.unit,
        price: (v.price / 100).toString(),
        mrp: v.mrp ? (v.mrp / 100).toString() : "",
        stock: v.stock.toString(),
        image: v.image ?? "",
      })));
      setLoading(false);
    });
  }, [id, router]);

  const update = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  const updateVariant = (i: number, k: keyof Variant, v: string) =>
    setVariantRows(prev => prev.map((r, idx) => idx === i ? { ...r, [k]: v } : r));

  const addVariant = () =>
    setVariantRows(prev => [...prev, { unit: "", price: form.price, mrp: form.mrp, stock: "0", image: "" }]);

  const removeVariant = (i: number) =>
    setVariantRows(prev => prev.filter((_, idx) => idx !== i));

  const enableVariants = () => {
    const firstImg = images[0] ?? "";
    setVariantRows([{ unit: form.unit, price: form.price, mrp: form.mrp, stock: form.stock, image: firstImg }]);
  };

  const buildVariantsPayload = () =>
    variantRows
      .filter(v => v.unit.trim() && parseFloat(v.price) > 0)
      .map(v => ({
        unit: v.unit.trim(),
        price: Math.round(parseFloat(v.price) * 100),
        mrp: v.mrp ? Math.round(parseFloat(v.mrp) * 100) : null,
        stock: parseInt(v.stock) || 0,
        image: v.image || null,
      }));

  const handleSaveVariants = async () => {
    const variants = buildVariantsPayload();
    if (variants.length === 0) { toast.error("Add at least one variant with a unit and price"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variants }),
      });
      if (res.status === 403) throw new Error("FORBIDDEN");
      if (!res.ok) throw new Error();
      toast.success("Variants saved");
    } catch (err: any) {
      if (err.message === "FORBIDDEN") {
        toast.error("You do not have permission to perform this action.");
      } else {
        toast.error("Failed to save variants");
      }
    } finally { setSaving(false); }
  };

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

  const handleVariantImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so re-selecting same file triggers onChange
    e.target.value = "";
    setUploadingIdx(idx);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "products");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) updateVariant(idx, "image", data.medium);
      else toast.error(data.error ?? "Upload failed");
    } finally { setUploadingIdx(null); }
  };

  const handleSave = async () => {
    if (!form.name) { toast.error("Name is required"); return; }
    const hasVariants = variantRows.length > 0;
    if (!hasVariants && !form.price) { toast.error("Price is required"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, slug: form.slug || toSlug(form.name),
          description: form.description || null,
          ...(hasVariants ? {} : {
            price: Math.round(parseFloat(form.price) * 100),
            mrp: form.mrp ? Math.round(parseFloat(form.mrp) * 100) : null,
            unit: form.unit || null,
            stock: parseInt(form.stock),
          }),
          categoryId: form.categoryId ? parseInt(form.categoryId) : null,
          brand: form.brand || null, veg: form.veg || null,
          featured: form.featured, active: form.active, images,
          ...(hasVariants ? { variants: buildVariantsPayload() } : {}),
        }),
      });
      if (res.status === 403) throw new Error("FORBIDDEN");
      const data = await res.json();
      if (res.ok) { toast.success("Saved!"); router.push("/admin/products"); }
      else toast.error(data.error ?? "Failed to save");
    } catch (err: any) { 
      if (err.message === "FORBIDDEN") {
        toast.error("You do not have permission to perform this action.");
      } else {
        toast.error("Failed to save");
      }
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (res.status === 403) throw new Error("FORBIDDEN");
      if (res.ok) { toast.success("Product deleted"); router.push("/admin/products"); }
      else toast.error("Failed to delete");
    } catch (err: any) {
      if (err.message === "FORBIDDEN") {
        toast.error("You do not have permission to perform this action.");
      } else {
        toast.error("Failed to delete");
      }
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
            <div className="bg-gray-100 rounded-lg animate-pulse" style={{ height: h }} />
          </div>
        ))}
      </div>
    );
  }

  const hasVariants = variantRows.length > 0;

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
            <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-500 ml-0.5">No</button>
          </div>
        )}
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Basic Info</h2>
        {([
          { key: "name", label: "Product Name *", type: "text" },
          { key: "slug", label: "Slug", type: "text" },
          { key: "description", label: "Description", type: "textarea" },
        ] as const).map(({ key, label, type }) => (
          <div key={key}>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">{label}</label>
            {type === "textarea" ? (
              <textarea rows={3} value={form[key] as string} onChange={e => update(key, e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400/30 resize-none" />
            ) : (
              <input type="text" value={form[key] as string}
                onChange={e => { update(key, e.target.value); if (key === "name") update("slug", toSlug(e.target.value)); }}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400/30" />
            )}
          </div>
        ))}
      </div>

      {/* Pricing & Stock — hidden when variants active */}
      {!hasVariants && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Pricing &amp; Stock</h2>
          <div className="grid grid-cols-2 gap-4">
            {([
              { key: "price", label: "Price *", rupee: true },
              { key: "mrp",   label: "MRP",     rupee: true },
              { key: "stock", label: "Stock",   rupee: false },
              { key: "unit",  label: "Unit (e.g. 500g, 1L)", rupee: false },
            ] as const).map(({ key, label, rupee }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">{label}</label>
                <div className="relative">
                  {rupee && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500 pointer-events-none">₹</span>}
                  <input type={key === "unit" ? "text" : "number"} min="0"
                    value={form[key] as string} onChange={e => update(key, e.target.value)}
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
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Brand</label>
              <input value={form.brand} onChange={e => update("brand", e.target.value)}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Veg / Non-veg</label>
              <select value={form.veg} onChange={e => update("veg", e.target.value)}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none">
                <option value="">Not applicable</option>
                <option value="veg">Veg</option>
                <option value="nonveg">Non-veg</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {([{ key: "active", label: "Active" }, { key: "featured", label: "Featured" }] as const).map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form[key] as boolean} onChange={e => update(key, e.target.checked)} className="w-4 h-4 rounded text-green-600" />
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </label>
            ))}
          </div>
          <button onClick={enableVariants}
            className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1.5 border border-violet-200 px-3 py-1.5 rounded-lg hover:bg-violet-50 transition-colors">
            <Plus size={12} /> Enable size variants (500g / 1kg / 2kg…)
          </button>
        </div>
      )}

      {/* Variants table */}
      {hasVariants && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Variants</h2>
              <p className="text-xs text-gray-400 mt-0.5">{variantRows.length} size{variantRows.length !== 1 ? "s" : ""} — prices in ₹</p>
            </div>
            <div className="flex items-center gap-3">
              <select value={form.categoryId} onChange={e => update("categoryId", e.target.value)}
                className="h-8 px-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none">
                <option value="">No category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => update("active", e.target.checked)} className="w-3.5 h-3.5" />
                Active
              </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100">
                  <th className="text-left pb-2 font-semibold w-12">Image</th>
                  <th className="text-left pb-2 font-semibold">Unit / Size</th>
                  <th className="text-left pb-2 font-semibold">Price (₹)</th>
                  <th className="text-left pb-2 font-semibold">MRP (₹)</th>
                  <th className="text-left pb-2 font-semibold">Stock</th>
                  <th className="pb-2 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {variantRows.map((row, i) => (
                  <tr key={i} className="align-middle">
                    {/* Image cell */}
                    <td className="py-2 pr-3">
                      <div className="flex flex-col items-center gap-0.5">
                        <label className="relative w-11 h-11 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer group shrink-0 flex items-center justify-center">
                          {uploadingIdx === i ? (
                            <Loader2 size={14} className="animate-spin text-gray-400" />
                          ) : row.image ? (
                            <>
                              <Image src={row.image} alt="" fill className="object-cover" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                <ImagePlus size={13} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </>
                          ) : (
                            <ImagePlus size={15} className="text-gray-300 group-hover:text-green-400 transition-colors" />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={e => handleVariantImageUpload(e, i)}
                            disabled={uploadingIdx !== null}
                          />
                        </label>
                        {row.image && (
                          <button
                            onClick={() => updateVariant(i, "image", "")}
                            className="text-[9px] text-gray-300 hover:text-red-500 transition-colors leading-none"
                            title="Remove image"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-2 pr-3">
                      <input value={row.unit} onChange={e => updateVariant(i, "unit", e.target.value)}
                        placeholder="e.g. 500g"
                        className="w-full h-8 px-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-400" />
                    </td>
                    <td className="py-2 pr-3">
                      <input type="number" min="0" step="0.01" value={row.price} onChange={e => updateVariant(i, "price", e.target.value)}
                        className="w-full h-8 px-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-400" />
                    </td>
                    <td className="py-2 pr-3">
                      <input type="number" min="0" step="0.01" value={row.mrp} onChange={e => updateVariant(i, "mrp", e.target.value)}
                        placeholder="optional"
                        className="w-full h-8 px-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-400" />
                    </td>
                    <td className="py-2 pr-3">
                      <input type="number" min="0" value={row.stock} onChange={e => updateVariant(i, "stock", e.target.value)}
                        className="w-20 h-8 px-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-400" />
                    </td>
                    <td className="py-2">
                      <button onClick={() => removeVariant(i)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                        title="Remove row">
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button onClick={addVariant}
              className="flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors">
              <Plus size={14} /> Add size
            </button>
            <button onClick={handleSaveVariants} disabled={saving}
              className="flex items-center gap-1.5 h-8 px-4 bg-green-600 text-white text-xs font-semibold rounded-xl disabled:opacity-50 hover:bg-green-700 transition-colors">
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Save variants
            </button>
          </div>

          <button onClick={() => setVariantRows([])}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors">
            Remove all variants (revert to single product)
          </button>
        </div>
      )}

      {/* Images */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Images</h2>
        <div className="flex gap-3 flex-wrap">
          {images.map((url, i) => (
            <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
              <Image src={url} alt="" fill className="object-cover" />
              <button onClick={() => setImages(images.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">×</button>
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
