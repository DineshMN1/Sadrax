"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/store/product-card";

interface P { id: number; name: string; price: number; mrp: number | null; unit: string | null; images: unknown; stock: number; veg: string | null }

export function FrequentlyBought({ productId }: { productId: number }) {
  const [items, setItems] = useState<P[]>([]);

  useEffect(() => {
    let active = true;
    fetch(`/api/products/${productId}/related`)
      .then((r) => r.json())
      .then((d) => { if (active) setItems(d.products ?? []); })
      .catch(() => {});
    return () => { active = false; };
  }, [productId]);

  if (items.length === 0) return null;

  return (
    <section className="px-4 py-4">
      <h2 className="text-base font-extrabold text-gray-900 mb-3">Frequently bought together</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((p) => (
          <ProductCard key={p.id} id={p.id} name={p.name} price={p.price} mrp={p.mrp} unit={p.unit} images={p.images as string[]} stock={p.stock} veg={p.veg} />
        ))}
      </div>
    </section>
  );
}
