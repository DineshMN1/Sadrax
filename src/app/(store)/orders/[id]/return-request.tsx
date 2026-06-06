"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { AlertCircle, Camera, Loader2, X, ShieldCheck, Phone } from "lucide-react";
import { RETURN_REASONS, RETURN_REASON_LABELS, RETURN_STATUS_META } from "@/lib/returns";

interface ExistingRequest {
  reason: string;
  description: string | null;
  status: string;
  resolution: string | null;
  adminNote: string | null;
  photos: string[] | null;
}

interface Props {
  orderId: number;
  windowOpen: boolean;
  items: { name: string; quantity: number }[];
  existing: ExistingRequest | null;
  storePhone: string;
}

export function ReturnRequest({ orderId, windowOpen, items, existing, storePhone }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Already raised: show its status ──
  if (existing) {
    const meta = RETURN_STATUS_META[existing.status] ?? RETURN_STATUS_META.pending;
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-gray-900">Return request</h2>
          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${meta.tone}`}>{meta.label}</span>
        </div>
        <p className="text-xs text-gray-500">Reason: <span className="font-semibold text-gray-700">{RETURN_REASON_LABELS[existing.reason] ?? existing.reason}</span></p>
        {existing.description && <p className="text-xs text-gray-500">“{existing.description}”</p>}
        {existing.status === "approved" && existing.resolution && (
          <p className="text-xs text-green-700 font-semibold">
            {existing.resolution === "replacement" ? "Replacement arranged — we'll be in touch." : "Refund approved — processed per our policy."}
          </p>
        )}
        {existing.adminNote && <p className="text-xs text-gray-500">Store note: {existing.adminNote}</p>}
        {existing.photos && existing.photos.length > 0 && (
          <div className="flex gap-2 pt-1">
            {existing.photos.map((p, i) => (
              <div key={i} className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 relative">
                <Image src={p} alt="evidence" fill className="object-cover" sizes="48px" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Window closed: point to phone for health/safety exceptions ──
  if (!windowOpen) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck size={18} className="text-gray-400 shrink-0 mt-0.5" />
        <div className="text-xs text-gray-500">
          <p className="font-semibold text-gray-700">Reporting window closed</p>
          <p className="mt-0.5">Issues must be reported within 2 hours of delivery. For health or safety concerns, call us right away.</p>
          <a href={`tel:+91${storePhone.replace(/\D/g, "")}`} className="inline-flex items-center gap-1 mt-1.5 font-bold text-green-600">
            <Phone size={12} /> +91 {storePhone}
          </a>
        </div>
      </div>
    );
  }

  const togglePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files.slice(0, 5 - photos.length)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "returns");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (res.ok) setPhotos((p) => [...p, data.medium]);
        else toast.error(data.error ?? "Upload failed");
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const togglePick = (name: string) =>
    setPicked((s) => { const n = new Set(s); if (n.has(name)) n.delete(name); else n.add(name); return n; });

  const submit = async () => {
    if (!reason) { toast.error("Please choose a reason"); return; }
    if (photos.length === 0) { toast.error("Add at least one photo of the issue"); return; }
    setSubmitting(true);
    try {
      const affected = items.filter((i) => picked.has(i.name)).map((i) => ({ name: i.name, quantity: i.quantity }));
      const res = await fetch(`/api/orders/${orderId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, description, photos, items: affected }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Could not submit"); return; }
      toast.success("Request submitted — we'll review it shortly");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 h-11 bg-white border border-orange-200 text-orange-600 text-sm font-bold rounded-2xl hover:bg-orange-50 transition-colors"
      >
        <AlertCircle size={15} /> Report an issue with this order
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-gray-900">Report an issue</h2>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
      </div>

      {/* Reason */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500">What went wrong?</p>
        {RETURN_REASONS.map((r) => (
          <label key={r.value} className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${reason === r.value ? "border-green-400 bg-green-50" : "border-gray-200 hover:bg-gray-50"}`}>
            <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} className="mt-0.5 accent-green-600" />
            <div>
              <p className="text-sm font-semibold text-gray-800">{r.label}</p>
              <p className="text-xs text-gray-400">{r.desc}</p>
            </div>
          </label>
        ))}
      </div>

      {/* Affected items (optional) */}
      {items.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500">Affected items <span className="font-normal text-gray-400">(optional)</span></p>
          <div className="flex flex-wrap gap-2">
            {items.map((i) => (
              <button key={i.name} onClick={() => togglePick(i.name)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${picked.has(i.name) ? "bg-green-500 border-green-500 text-white" : "bg-white border-gray-200 text-gray-600"}`}>
                {i.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-500">Details <span className="font-normal text-gray-400">(optional)</span></p>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={1000}
          placeholder="Tell us what happened…"
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 resize-none" />
      </div>

      {/* Photos (required) */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500">Photo of the issue <span className="text-red-400">*</span></p>
        <div className="flex flex-wrap gap-2">
          {photos.map((p, i) => (
            <div key={i} className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 relative group">
              <Image src={p} alt="evidence" fill className="object-cover" sizes="64px" />
              <button onClick={() => setPhotos((ph) => ph.filter((_, j) => j !== i))}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center"><X size={11} /></button>
            </div>
          ))}
          {photos.length < 5 && (
            <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50 text-gray-400">
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
              <input type="file" accept="image/*" multiple className="hidden" onChange={togglePhoto} disabled={uploading} />
            </label>
          )}
        </div>
      </div>

      <button onClick={submit} disabled={submitting || uploading}
        className="w-full h-11 flex items-center justify-center gap-2 bg-green-600 text-white text-sm font-bold rounded-2xl hover:bg-green-700 disabled:opacity-50">
        {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
        Submit request
      </button>
      <p className="text-[11px] text-gray-400 text-center">Per our Refund &amp; Cancellation policy, issues must be reported within 2 hours of delivery.</p>
    </div>
  );
}
