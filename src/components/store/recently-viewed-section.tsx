"use client";

import { useRecentlyViewed } from "@/store/recently-viewed";
import { ProductCard } from "@/components/store/product-card";
import { Clock } from "lucide-react";

export function RecentlyViewedSection() {
  const { items, clear } = useRecentlyViewed();

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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.slice(0, 4).map(p => (
          <ProductCard
            key={p.id}
            id={p.id}
            name={p.name}
            price={p.price}
            mrp={p.mrp}
            unit={p.unit}
            images={p.images}
            stock={p.stock}
          />
        ))}
      </div>
    </section>
  );
}
