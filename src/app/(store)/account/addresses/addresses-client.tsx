"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { MapPin, Plus, Trash2, ChevronLeft, Star, Navigation } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";

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

export default function AddressesClient() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pinLat, setPinLat] = useState<number | null>(null);
  const [pinLng, setPinLng] = useState<number | null>(null);
  const [form, setForm] = useState({
    label: "home", name: "", phone: "",
    line1: "", line2: "", city: "Sadras", pincode: "",
  });

  useEffect(() => {
    if (!session && !isPending) router.replace("/login?redirect=/account/addresses");
  }, [session, isPending, router]);

  const fetchAddresses = async () => {
    const res = await fetch("/api/addresses");
    const data = await res.json();
    setAddresses(data.addresses ?? []);
    setLoading(false);
  };

  useEffect(() => { if (session) fetchAddresses(); }, [session]);

  const handlePinConfirm = (pos: { lat: number; lng: number }, display?: string) => {
    setPinLat(pos.lat);
    setPinLng(pos.lng);
    setShowMap(false);
    const pincodeMatch = display?.match(/\b6\d{5}\b/);
    if (pincodeMatch) setForm(p => ({ ...p, pincode: pincodeMatch[0] }));
    const parts = display?.split(",") ?? [];
    if (parts.length >= 2) setForm(p => ({ ...p, line1: parts.slice(0, 2).join(",").trim().slice(0, 80) }));
  };

  const handleSave = async () => {
    if (!form.name || !form.phone || !form.line1 || !form.pincode) {
      toast.error("Fill all required fields"); return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, lat: pinLat, lng: pinLng }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Could not save"); return; }
      toast.success("Address saved!");
      setShowForm(false);
      setForm({ label: "home", name: "", phone: "", line1: "", line2: "", city: "Sadras", pincode: "" });
      setPinLat(null); setPinLng(null);
      fetchAddresses();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this address?")) return;
    await fetch("/api/addresses", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    fetchAddresses();
  };

  if (isPending || loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (showMap) {
    return (
      <div className="flex flex-col h-screen">
        <div className="px-4 pt-4 pb-2 bg-white border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowMap(false)} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100">
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
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href="/account" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Saved Addresses</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="ml-auto flex items-center gap-1.5 text-sm font-semibold text-green-600"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Add form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 shadow-sm">
            <h2 className="font-semibold text-gray-900">New Address</h2>

            {/* Label */}
            <div className="flex gap-2">
              {["home","work","other"].map(l => (
                <button key={l} onClick={() => setForm(p => ({ ...p, label: l }))}
                  className={`flex-1 h-8 rounded-xl text-xs font-semibold capitalize ${form.label === l ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                  {l}
                </button>
              ))}
            </div>

            {/* Pin map button */}
            <button onClick={() => setShowMap(true)}
              className={`w-full flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all text-sm font-medium ${pinLat ? "border-green-400 bg-green-50 text-green-700" : "border-dashed border-gray-200 text-gray-500 hover:border-green-400"}`}>
              <Navigation size={16} className={pinLat ? "text-green-600" : "text-gray-400"} />
              {pinLat ? `Pinned: ${pinLat.toFixed(4)}, ${pinLng?.toFixed(4)}` : "Pin on map (optional)"}
            </button>

            {[
              { k: "name", p: "Full Name *" },
              { k: "phone", p: "Phone *", mode: "numeric" as const },
              { k: "line1", p: "Street / Area *" },
              { k: "line2", p: "Landmark" },
              { k: "city", p: "City" },
              { k: "pincode", p: "Pincode *", mode: "numeric" as const },
            ].map(({ k, p, mode }) => (
              <input key={k} placeholder={p} inputMode={mode}
                value={(form as Record<string, string>)[k]}
                onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400/30"
              />
            ))}

            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 h-10 border border-gray-200 rounded-xl text-sm text-gray-600">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 h-10 bg-green-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        )}

        {/* Address list */}
        {addresses.length === 0 && !showForm ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <MapPin size={28} className="text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-700">No saved addresses</h3>
            <p className="text-sm text-gray-400 mt-1">Add an address to speed up checkout</p>
            <button onClick={() => setShowForm(true)} className="mt-4 bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">
              Add Address
            </button>
          </div>
        ) : (
          addresses.map((addr) => (
            <div key={addr.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-3 shadow-sm">
              <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                <MapPin size={16} className="text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-gray-500 uppercase">{addr.label}</span>
                  {addr.isDefault && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                      <Star size={9} fill="currentColor" /> Default
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-900">{addr.name}</p>
                <p className="text-sm text-gray-600">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                <p className="text-xs text-gray-400 mt-0.5">{addr.city} — {addr.pincode} · {addr.phone}</p>
                {addr.lat && <p className="text-[10px] text-gray-300 mt-0.5">📍 {addr.lat.toFixed(4)}, {addr.lng?.toFixed(4)}</p>}
              </div>
              <button onClick={() => handleDelete(addr.id)} className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors shrink-0">
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
