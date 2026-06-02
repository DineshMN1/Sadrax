"use client";

import { useState } from "react";
import { toast } from "sonner";

export function ProductToggle({ id, active }: { id: number; active: boolean }) {
  const [checked, setChecked] = useState(active);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !checked }),
      });
      if (res.ok) setChecked(!checked);
      else toast.error("Failed to update");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`relative w-10 h-5 rounded-full transition-colors ${checked ? "bg-green-500" : "bg-gray-200"} disabled:opacity-50`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}
