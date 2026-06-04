"use client";

import { useState, useEffect } from "react";
import { Save, Store, Truck, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Settings {
  store_open: string;
  open_time: string;
  close_time: string;
  free_delivery_threshold: string;
  delivery_fee: string;
  delivery_eta: string;
  delivery_pincodes: string;
  store_name: string;
  store_address: string;
  store_phone: string;
}

const DEFAULTS: Settings = {
  store_open: "true",
  open_time: "08:00",
  close_time: "21:00",
  free_delivery_threshold: "20000",
  delivery_fee: "2900",
  delivery_eta: "30–45 min",
  delivery_pincodes: "603102,603104,603103,603105",
  store_name: "Sadrax Grocery",
  store_address: "Sadras, Tamil Nadu",
  store_phone: "",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then(data => {
        setSettings(s => ({ ...s, ...data.settings }));
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) toast.success("Settings saved!");
      else toast.error("Failed to save");
    } finally { setSaving(false); }
  };

  const set = (key: keyof Settings) => (val: string) =>
    setSettings(p => ({ ...p, [key]: val }));

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50">
          <Save size={15} /> {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {/* Store Open/Close */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Store size={16} className="text-green-600" />
          <h2 className="font-semibold text-gray-900">Store Status</h2>
        </div>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-semibold text-gray-900">Store is Open</p>
            <p className="text-xs text-gray-400">Toggle to pause all new orders</p>
          </div>
          <button
            onClick={() => set("store_open")(settings.store_open === "true" ? "false" : "true")}
            className={`relative w-12 h-6 rounded-full transition-colors ${settings.store_open === "true" ? "bg-green-500" : "bg-gray-300"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.store_open === "true" ? "left-6" : "left-0.5"}`} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Opens at</label>
            <input type="time" value={settings.open_time} onChange={e => set("open_time")(e.target.value)}
              className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Closes at</label>
            <input type="time" value={settings.close_time} onChange={e => set("close_time")(e.target.value)}
              className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
        </div>
      </div>

      {/* Delivery */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Truck size={16} className="text-green-600" />
          <h2 className="font-semibold text-gray-900">Delivery Settings</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Delivery Fee (₹)</label>
            <input type="number" step="0.01"
              value={(parseInt(settings.delivery_fee) / 100).toString()}
              onChange={e => set("delivery_fee")(String(Math.round(parseFloat(e.target.value) * 100)))}
              className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Free Delivery Above (₹)</label>
            <input type="number" step="0.01"
              value={(parseInt(settings.free_delivery_threshold) / 100).toString()}
              onChange={e => set("free_delivery_threshold")(String(Math.round(parseFloat(e.target.value) * 100)))}
              className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Estimated Delivery Time</label>
          <input value={settings.delivery_eta} onChange={e => set("delivery_eta")(e.target.value)}
            placeholder="e.g. 30–45 min"
            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          <p className="text-xs text-gray-400 mt-1">Shown to customers on checkout and order pages</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Delivery Pincodes (comma-separated)</label>
          <input value={settings.delivery_pincodes} onChange={e => set("delivery_pincodes")(e.target.value)}
            placeholder="603102,603104" className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none font-mono" />
          <p className="text-xs text-gray-400 mt-1">We only deliver to these pincodes</p>
        </div>
      </div>

      {/* Store Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-green-600" />
          <h2 className="font-semibold text-gray-900">Store Info</h2>
        </div>
        {[
          { k: "store_name" as keyof Settings, l: "Store Name", p: "Sadrax Grocery" },
          { k: "store_address" as keyof Settings, l: "Address", p: "Sadras, Tamil Nadu" },
          { k: "store_phone" as keyof Settings, l: "Phone", p: "+91 98765 43210" },
        ].map(({ k, l, p }) => (
          <div key={k}>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">{l}</label>
            <input value={settings[k]} onChange={e => set(k)(e.target.value)} placeholder={p}
              className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
        ))}
      </div>
    </div>
  );
}
