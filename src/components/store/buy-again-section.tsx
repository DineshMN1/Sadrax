"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/store/product-card";
import { RotateCcw } from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  mrp: number | null;
  unit: string | null;
  images: string[];
  stock: number;
}

export function BuyAgainSection() {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    // Fetch last order items, deduplicated as products
    fetch("/api/orders/buy-again")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.products) setItems(data.products); })
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-base font-extrabold text-gray-900">Buy Again</h2>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
          <RotateCcw size={9} /> From your orders
        </span>
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
