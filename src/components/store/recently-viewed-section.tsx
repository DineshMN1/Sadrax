"use client";

import { useEffect, useMemo, useState } from "react";
import { useRecentlyViewed } from "@/store/recently-viewed";
import { ProductCard } from "@/components/store/product-card";
import { Clock } from "lucide-react";

export function RecentlyViewedSection() {
  const { items, clear } = useRecentlyViewed();
  const shown = items.slice(0, 6);

  // Recently-viewed is persisted in localStorage, so its stock is frozen at
  // view time. Re-fetch live stock so a now-out-of-stock item shows correctly
  // (and can't be added). Products missing from the response = inactive → 0.
  const idsKey = useMemo(() => shown.map(p => p.id).sort((a, b) => a - b).join(","), [shown]);
  const [stockMap, setStockMap] = useState<Record<number, number>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!idsKey) return;
    let active = true;
    fetch(`/api/products?ids=${idsKey}`)
      .then(r => r.json())
      .then((d: { products?: { id: number; stock: number }[] }) => {
        if (!active) return;
        const m: Record<number, number> = {};
        for (const p of d.products ?? []) m[p.id] = p.stock;
        setStockMap(m);
      })
      .catch(() => {})
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, [idsKey]);

  if (items.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-extrabold text-gray-900">Recently Viewed</h2>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            <Clock size={9} />
          </span>
        </div>
        <button onClick={clear} className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
          Clear
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
        {shown.map(p => (
          <ProductCard
            key={p.id}
            id={p.id}
            name={p.name}
            price={p.price}
            mrp={p.mrp}
            unit={p.unit}
            images={p.images}
            stock={loaded ? (stockMap[p.id] ?? 0) : p.stock}
          />
        ))}
      </div>
    </section>
  );
}
