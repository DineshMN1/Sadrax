"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Plus, Upload, Trash2, Pencil, X, GripVertical, Eye, EyeOff, Zap, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BANNER_THEMES, getBannerTheme } from "@/lib/banner-themes";

const MAX_BANNERS = 5;

interface Banner {
  id: number;
  title: string | null;
  subtitle: string | null;
  badge: string | null;
  image: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  theme: string;
  order: number;
  active: boolean;
}

type Draft = {
  title: string;
  subtitle: string;
  badge: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  theme: string;
  order: string;
  active: boolean;
};

const EMPTY: Draft = {
  title: "", subtitle: "", badge: "", image: "",
  ctaText: "", ctaLink: "", theme: "green", order: "0", active: true,
};

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchBanners = async () => {
    const res = await fetch("/api/admin/banners");
    const data = await res.json();
    setBanners(data.banners ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchBanners(); }, []);

  const openNew = () => {
    if (banners.length >= MAX_BANNERS) { toast.error(`Maximum ${MAX_BANNERS} banners reached`); return; }
    setEditingId(null);
    setDraft({ ...EMPTY, order: String(banners.length) });
    setShowForm(true);
  };

  const openEdit = (b: Banner) => {
    setEditingId(b.id);
    setDraft({
      title: b.title ?? "", subtitle: b.subtitle ?? "", badge: b.badge ?? "",
      image: b.image ?? "", ctaText: b.ctaText ?? "", ctaLink: b.ctaLink ?? "",
      theme: b.theme, order: String(b.order), active: b.active,
    });
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "banners");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) setDraft((p) => ({ ...p, image: data.url ?? data.large }));
    else toast.error(data.error ?? "Upload failed");
    setUploading(false);
  };

  const handleSave = async () => {
    if (!draft.title && !draft.image) { toast.error("Add a title or an image"); return; }
    setSaving(true);
    const payload = {
      title: draft.title || null,
      subtitle: draft.subtitle || null,
      badge: draft.badge || null,
      image: draft.image || null,
      ctaText: draft.ctaText || null,
      ctaLink: draft.ctaLink || null,
      theme: draft.theme,
      order: parseInt(draft.order) || 0,
      active: draft.active,
    };
    const res = editingId
      ? await fetch(`/api/admin/banners/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      : await fetch("/api/admin/banners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) {
      toast.success(editingId ? "Banner updated" : "Banner added");
      setShowForm(false);
      setEditingId(null);
      fetchBanners();
    } else {
      const d = await res.json();
      toast.error(d.error ?? "Failed");
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this banner?")) return;
    await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    fetchBanners();
  };

  const toggleActive = async (b: Banner) => {
    await fetch(`/api/admin/banners/${b.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !b.active }),
    });
    fetchBanners();
  };

  const changeOrder = async (b: Banner, dir: -1 | 1) => {
    const sorted = [...banners].sort((a, c) => a.order - c.order || a.id - c.id);
    const idx = sorted.findIndex((x) => x.id === b.id);
    const swapWith = sorted[idx + dir];
    if (!swapWith) return;
    await Promise.all([
      fetch(`/api/admin/banners/${b.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: swapWith.order }) }),
      fetch(`/api/admin/banners/${swapWith.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: b.order }) }),
    ]);
    fetchBanners();
  };

  const sorted = [...banners].sort((a, b) => a.order - b.order || a.id - b.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Home Banners</h1>
          <p className="text-sm text-gray-400 mt-0.5">Up to {MAX_BANNERS}. Lower priority shows first; they auto-scroll on the home screen.</p>
        </div>
        <button
          onClick={openNew}
          disabled={banners.length >= MAX_BANNERS}
          className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={15} /> Add Banner
        </button>
      </div>

      {showForm && (
        <BannerForm
          draft={draft}
          setDraft={setDraft}
          editing={editingId !== null}
          saving={saving}
          uploading={uploading}
          onUpload={handleImageUpload}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingId(null); }}
        />
      )}

      {/* List */}
      <div className="space-y-2.5">
        {sorted.map((b, i) => {
          const theme = getBannerTheme(b.theme);
          return (
            <div key={b.id} className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
              {/* reorder */}
              <div className="flex flex-col">
                <button onClick={() => changeOrder(b, -1)} disabled={i === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-30 leading-none">▲</button>
                <GripVertical size={14} className="text-gray-300 my-0.5 self-center" />
                <button onClick={() => changeOrder(b, 1)} disabled={i === sorted.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-30 leading-none">▼</button>
              </div>

              {/* thumbnail */}
              <div className={`relative w-28 h-16 rounded-xl overflow-hidden shrink-0 flex items-center justify-center ${b.image ? "bg-gray-900" : theme.gradient}`}>
                {b.image
                  ? <Image src={b.image} alt={b.title ?? "Banner"} fill className="object-contain" sizes="112px" />
                  : <span className="text-white text-[9px] font-bold px-2 text-center line-clamp-2">{b.title}</span>}
              </div>

              {/* info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 truncate">{b.title || <span className="text-gray-400 italic">Image banner</span>}</p>
                  {!b.active && <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Hidden</span>}
                </div>
                {b.badge && <p className="text-xs text-green-600 font-medium truncate">⚡ {b.badge}</p>}
                {b.subtitle && <p className="text-xs text-gray-400 truncate">{b.subtitle}</p>}
                <p className="text-[10px] text-gray-300 mt-0.5">Priority {b.order}{b.ctaLink ? ` · → ${b.ctaLink}` : ""}</p>
              </div>

              {/* actions */}
              <div className="flex items-center gap-1.5">
                <button onClick={() => toggleActive(b)} title={b.active ? "Hide" : "Show"} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                  {b.active ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <button onClick={() => openEdit(b)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(b.id)} className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}

        {sorted.length === 0 && !loading && (
          <div className="bg-white rounded-2xl border border-gray-100 px-4 py-12 text-center text-gray-400 text-sm">
            No banners yet. Add one to show a promo on the home screen.
          </div>
        )}
      </div>
    </div>
  );
}

function BannerForm({
  draft, setDraft, editing, saving, uploading, onUpload, onSave, onCancel,
}: {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  editing: boolean;
  saving: boolean;
  uploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const theme = getBannerTheme(draft.theme);
  const set = (k: keyof Draft, v: string | boolean) => setDraft((p) => ({ ...p, [k]: v }));
  const input = "h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm w-full focus:outline-none focus:border-green-500";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
      <h2 className="font-semibold text-gray-900">{editing ? "Edit Banner" : "New Banner"}</h2>

      {/* Live preview */}
      {draft.image ? (
        <div className="relative rounded-2xl overflow-hidden aspect-3/1 bg-gray-100">
          <Image src={draft.image} alt="preview" fill className="object-contain" sizes="600px" />
        </div>
      ) : (
        <div className={`relative rounded-2xl p-5 overflow-hidden flex items-center min-h-30 ${theme.gradient}`}>
          <div className="relative z-10">
            {draft.badge && (
              <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full mb-2 backdrop-blur-sm ${theme.badgeBg}`}>
                <Zap size={10} fill="currentColor" />{draft.badge}
              </div>
            )}
            {draft.title && <h3 className={`text-lg font-extrabold leading-tight ${theme.text}`}>{draft.title}</h3>}
            {draft.subtitle && <p className={`text-xs mt-0.5 ${theme.sub}`}>{draft.subtitle}</p>}
            {draft.ctaText && (
              <span className={`inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1.5 rounded-lg mt-2.5 ${theme.ctaBg}`}>
                {draft.ctaText}<ChevronRight size={11} strokeWidth={3} />
              </span>
            )}
            {!draft.title && <p className="text-white/70 text-xs">Preview — upload an image, or fill the text below</p>}
          </div>
        </div>
      )}

      {/* Image upload — the promo artwork is the banner */}
      <div className="rounded-2xl border border-dashed border-gray-200 p-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 h-10 px-4 bg-green-600 text-white text-sm font-semibold rounded-xl cursor-pointer hover:bg-green-700">
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {draft.image ? "Replace image" : "Upload banner image"}
          <input type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={uploading} />
        </label>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-gray-600">Recommended: 1200 × 400 px · 3:1 ratio</span>
          <span className="text-[10px] text-gray-400">JPG / PNG / WebP · under 1 MB · design the promo text inside the image</span>
        </div>
        {draft.image && (
          <button onClick={() => set("image", "")} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 ml-auto">
            <X size={13} /> Remove
          </button>
        )}
      </div>

      {/* Redirect link — applies to image banners on tap */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-500">Redirect link <span className="font-normal text-gray-400">(opened when the banner is tapped)</span></label>
        <input className={input} value={draft.ctaLink} onChange={(e) => set("ctaLink", e.target.value)} placeholder="/categories  or  /category/fruits  or  /product/12" />
      </div>

      {/* Text-banner fields — only when no image is uploaded */}
      {!draft.image && (
        <div className="space-y-4 rounded-2xl bg-gray-50 border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500">No image? Build a text banner instead:</p>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">Badge <span className="font-normal text-gray-400">(e.g. 10-min local delivery)</span></label>
              <input className={input} value={draft.badge} onChange={(e) => set("badge", e.target.value)} placeholder="10-min local delivery" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">Title</label>
              <input className={input} value={draft.title} onChange={(e) => set("title", e.target.value)} placeholder="Fresh groceries, fast" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-gray-500">Subtitle</label>
              <input className={input} value={draft.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder="Delivered to your door in minutes" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">Button text</label>
              <input className={input} value={draft.ctaText} onChange={(e) => set("ctaText", e.target.value)} placeholder="Shop Now" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500">Theme</label>
            <div className="flex flex-wrap gap-2">
              {BANNER_THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => set("theme", t.id)}
                  className={`h-9 px-3 rounded-xl text-xs font-bold text-white ${t.gradient} ${draft.theme === t.id ? "ring-2 ring-offset-2 ring-gray-900" : "opacity-80 hover:opacity-100"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Priority + visibility */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-500">Priority</label>
          <input type="number" className="h-10 w-20 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:border-green-500" value={draft.order} onChange={(e) => set("order", e.target.value)} />
          <span className="text-[10px] text-gray-400">lower shows first</span>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer ml-auto">
          <input type="checkbox" checked={draft.active} onChange={(e) => set("active", e.target.checked)} className="w-4 h-4 accent-green-600" />
          Visible on home
        </label>
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 h-10 border border-gray-200 rounded-xl text-sm text-gray-600">Cancel</button>
        <button onClick={onSave} disabled={saving || uploading} className="flex-1 h-10 bg-green-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
          {saving ? "Saving…" : editing ? "Save changes" : "Add banner"}
        </button>
      </div>
    </div>
  );
}
