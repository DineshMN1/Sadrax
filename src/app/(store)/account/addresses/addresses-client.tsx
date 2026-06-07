"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { MapPin, Plus, Trash2, ChevronLeft, Star, Navigation, Pencil, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const LocationPicker = dynamic(
  () => import("@/components/store/location-picker").then(m => ({ default: m.LocationPicker })),
  { ssr: false }
);

interface Address {
  id: number;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city?: string;
  pincode: string;
  lat?: number;
  lng?: number;
  isDefault: boolean;
}

const EMPTY_FORM = { label: "home", name: "", phone: "", line1: "", line2: "", city: "Sadras", pincode: "" };

export default function AddressesClient() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [addresses, setAddresses]   = useState<Address[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editId, setEditId]         = useState<number | null>(null);
  const [showMap, setShowMap]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [pinLat, setPinLat]         = useState<number | null>(null);
  const [pinLng, setPinLng]         = useState<number | null>(null);
  const [form, setForm]             = useState(EMPTY_FORM);

  useEffect(() => {
    if (!session && !isPending) router.replace("/login?redirect=/account/addresses");
  }, [session, isPending, router]);

  const fetchAddresses = async () => {
    const res  = await fetch("/api/addresses");
    const data = await res.json();
    setAddresses(data.addresses ?? []);
    setLoading(false);
  };

  useEffect(() => { if (session) fetchAddresses(); }, [session]);

  const openAddForm = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setPinLat(null); setPinLng(null);
    setShowForm(true);
  };

  const openEditForm = (addr: Address) => {
    setEditId(addr.id);
    setForm({ label: addr.label, name: addr.name, phone: addr.phone, line1: addr.line1, line2: addr.line2 ?? "", city: addr.city ?? "Sadras", pincode: addr.pincode });
    setPinLat(addr.lat ?? null); setPinLng(addr.lng ?? null);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditId(null); };

  const handlePinConfirm = (pos: { lat: number; lng: number }, display?: string) => {
    setPinLat(pos.lat); setPinLng(pos.lng);
    setShowMap(false);
    const pincodeMatch = display?.match(/\b6\d{5}\b/);
    if (pincodeMatch) setForm(p => ({ ...p, pincode: pincodeMatch[0] }));
    const parts = display?.split(",") ?? [];
    if (parts.length >= 2) setForm(p => ({ ...p, line1: parts.slice(0, 2).join(",").trim().slice(0, 80) }));
  };

  const handleSave = async () => {
    if (!form.name || !form.phone || !form.line1 || !form.line2 || !form.pincode) {
      toast.error("Fill all required fields (incl. flat/door no & apartment/street)"); return;
    }
    // Encourage a map pin so the delivery partner can find them easily
    if (pinLat == null || pinLng == null) {
      if (confirm("Pin your exact location on the map so our delivery partner can reach you easily? (Recommended)")) {
        setShowMap(true);
        return;
      }
    }
    setSaving(true);
    try {
      const method = editId ? "PATCH" : "POST";
      const body   = editId ? { id: editId, ...form, lat: pinLat, lng: pinLng } : { ...form, lat: pinLat, lng: pinLng };
      const res    = await fetch("/api/addresses", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data   = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Could not save"); return; }
      toast.success(editId ? "Address updated!" : "Address saved!");
      closeForm();
      fetchAddresses();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await fetch("/api/addresses", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      toast.success("Address removed");
      setConfirmDeleteId(null);
      fetchAddresses();
    } finally { setDeletingId(null); }
  };

  const handleSetDefault = async (id: number) => {
    const res = await fetch("/api/addresses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isDefault: true }),
    });
    if (res.ok) { fetchAddresses(); toast.success("Default address updated"); }
  };

  if (isPending || loading) {
    return (
      <div className="px-4 py-6 space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}
      </div>
    );
  }

  if (showMap) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white">
        <div className="px-4 pt-4 pb-2 glass border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowMap(false)} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <h2 className="font-bold text-gray-900">Pin your location</h2>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <LocationPicker onConfirm={handlePinConfirm} onClose={() => setShowMap(false)} />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-20 glass border-b border-gray-100/80 px-4 py-3 flex items-center gap-3">
        <Link href="/account" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
          <ChevronLeft size={20} className="text-gray-700" />
        </Link>
        <h1 className="text-lg font-extrabold text-gray-900 flex-1">Saved Addresses</h1>
        <button
          onClick={openAddForm}
          className="flex items-center gap-1.5 text-sm font-bold text-green-600 hover:text-green-700 transition-colors"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Add / Edit form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 shadow-sm animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-gray-900">{editId ? "Edit Address" : "New Address"}</h2>
              <button onClick={closeForm} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                <X size={15} />
              </button>
            </div>

            {/* Label */}
            <div className="flex gap-2">
              {["home","work","other"].map(l => (
                <button key={l} onClick={() => setForm(p => ({ ...p, label: l }))}
                  className={cn("flex-1 h-9 rounded-xl text-xs font-bold capitalize transition-all",
                    form.label === l ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                  {l}
                </button>
              ))}
            </div>

            {/* Map pin */}
            <button onClick={() => setShowMap(true)}
              className={cn("w-full flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all text-sm font-medium",
                pinLat ? "border-green-400 bg-green-50 text-green-700" : "border-dashed border-gray-200 text-gray-500 hover:border-green-400")}>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", pinLat ? "bg-green-500" : "bg-gray-100")}>
                <Navigation size={14} className={pinLat ? "text-white" : "text-gray-400"} />
              </div>
              {pinLat ? `Pinned ✓ (${pinLat.toFixed(4)}, ${pinLng?.toFixed(4)})` : "📍 Pin your location (recommended for delivery)"}
            </button>

            {[
              { k: "name",    p: "Full Name *" },
              { k: "phone",   p: "Phone *",          mode: "numeric" as const },
              { k: "line1",   p: "Flat / Door No *" },
              { k: "line2",   p: "Apartment name / Street *" },
              { k: "city",    p: "City" },
              { k: "pincode", p: "Pincode *",         mode: "numeric" as const },
            ].map(({ k, p, mode }) => (
              <input key={k} placeholder={p} inputMode={mode}
                value={(form as Record<string,string>)[k]}
                onChange={e => setForm(f => ({ ...f, [k]: k === "phone" ? e.target.value.replace(/\D/g, "").slice(-10) : e.target.value }))}
                className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all"
              />
            ))}

            <div className="flex gap-2">
              <button onClick={closeForm} className="flex-1 h-11 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Check size={14} /> {editId ? "Update" : "Save"}</>}
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {addresses.length === 0 && !showForm && (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mb-4">
              <MapPin size={28} className="text-gray-400" />
            </div>
            <h3 className="font-bold text-gray-700">No saved addresses</h3>
            <p className="text-sm text-gray-400 mt-1 mb-5">Add an address to speed up checkout</p>
            <button onClick={openAddForm} className="bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold">
              Add Address
            </button>
          </div>
        )}

        {/* Address list */}
        {addresses.map(addr => (
          <div key={addr.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 flex items-start gap-3">
              <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                <MapPin size={16} className="text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded-full">{addr.label}</span>
                  {addr.isDefault && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                      <Star size={9} fill="currentColor" /> Default
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-gray-900">{addr.name}</p>
                <p className="text-sm text-gray-600 mt-0.5">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                <p className="text-xs text-gray-400 mt-0.5">{addr.city} — {addr.pincode} · {addr.phone}</p>
              </div>
            </div>

            {/* Actions row */}
            <div className="border-t border-gray-50 px-4 py-2 flex items-center gap-1">
              <button onClick={() => openEditForm(addr)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                <Pencil size={12} /> Edit
              </button>
              {!addr.isDefault && (
                <button onClick={() => handleSetDefault(addr.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                  <Star size={12} /> Set default
                </button>
              )}
              <div className="ml-auto">
                {confirmDeleteId === addr.id ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500 font-medium">Remove?</span>
                    <button
                      onClick={() => handleDelete(addr.id)}
                      disabled={deletingId === addr.id}
                      className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-60">
                      {deletingId === addr.id ? <Loader2 size={12} className="animate-spin" /> : "Yes"}
                    </button>
                    <button onClick={() => setConfirmDeleteId(null)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-200 transition-colors">
                      No
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteId(addr.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors">
                    <Trash2 size={12} /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
