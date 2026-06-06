"use client";

import { useState } from "react";
import { Repeat, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  items: { productId: number; quantity: number }[];
  addressId: number | null;
}

const FREQ = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Monthly" },
];

export function RepeatOrder({ items, addressId }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const subscribe = async (frequency: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, addressId, frequency }),
      });
      if (!res.ok) { toast.error("Couldn't set up recurring order"); return; }
      setDone(true);
      toast.success("Recurring order set up!");
      setTimeout(() => setOpen(false), 1200);
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="w-full flex items-center justify-center gap-2 h-11 bg-green-50 text-green-700 text-sm font-bold rounded-2xl">
        <Check size={15} /> Recurring order active
      </div>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 h-11 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-2xl hover:bg-gray-50 transition-colors">
        <Repeat size={15} /> Repeat this order
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2.5">
      <p className="text-sm font-semibold text-gray-700">How often should we reorder these items?</p>
      <div className="flex flex-wrap gap-2">
        {FREQ.map((f) => (
          <button key={f.value} onClick={() => subscribe(f.value)} disabled={saving}
            className="flex-1 min-w-24 h-10 px-3 rounded-xl text-sm font-semibold bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : f.label}
          </button>
        ))}
      </div>
      <button onClick={() => setOpen(false)} className="w-full h-9 text-sm font-semibold text-gray-400 hover:text-gray-600">Cancel</button>
    </div>
  );
}
