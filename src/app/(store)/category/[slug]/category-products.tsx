"use client";

import { useState, useMemo } from "react";
import { ProductCard } from "@/components/store/product-card";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

type SortKey = "popular" | "price_asc" | "price_desc" | "discount";
type FilterKey = "instock" | "has_discount";

interface Product {
  id: number;
  name: string;
  price: number;
  mrp: number | null;
  unit: string | null;
  images: unknown;
  stock: number;
  orderCount: number;
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "popular",    label: "Popular"       },
  { value: "price_asc",  label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "discount",   label: "Highest Discount"  },
];

export function CategoryProducts({ initialItems }: { initialItems: Product[] }) {
  const [sort, setSort]         = useState<SortKey>("popular");
  const [filters, setFilters]   = useState<Set<FilterKey>>(new Set());
  const [showSort, setShowSort] = useState(false);

  const toggleFilter = (f: FilterKey) =>
    setFilters(prev => {
      const next = new Set(prev);
      next.has(f) ? next.delete(f) : next.add(f);
      return next;
    });

  const processed = useMemo(() => {
    let list = [...initialItems];

    // Filter
    if (filters.has("instock"))     list = list.filter(p => p.stock > 0);
    if (filters.has("has_discount")) list = list.filter(p => p.mrp && p.mrp > p.price);

    // Sort
    switch (sort) {
      case "price_asc":  list.sort((a, b) => a.price - b.price); break;
      case "price_desc": list.sort((a, b) => b.price - a.price); break;
      case "discount":   list.sort((a, b) => {
        const da = a.mrp && a.mrp > a.price ? (a.mrp - a.price) / a.mrp : 0;
        const db = b.mrp && b.mrp > b.price ? (b.mrp - b.price) / b.mrp : 0;
        return db - da;
      }); break;
      default: list.sort((a, b) => b.orderCount - a.orderCount);
    }
    return list;
  }, [initialItems, sort, filters]);

  const activeFilters = filters.size;
  const currentSort  = SORT_OPTIONS.find(o => o.value === sort)!;

  if (initialItems.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <span className="text-5xl mb-4">📦</span>
        <h3 className="font-bold text-gray-700">Nothing here yet</h3>
        <p className="text-sm text-gray-400 mt-1">Products coming soon in this category</p>
      </div>
    );
  }

  return (
    <div>
      {/* Sort + Filter bar */}
      <div className="flex items-center gap-2 mb-4">
        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSort(v => !v)}
            className="flex items-center gap-1.5 h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:border-gray-300 transition-colors"
          >
            <SlidersHorizontal size={13} className="text-gray-500" />
            {currentSort.label}
            <ChevronDown size={12} className={cn("transition-transform", showSort && "rotate-180")} />
          </button>
          {showSort && (
            <div className="absolute top-11 left-0 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-10 min-w-48 animate-slide-up">
              {SORT_OPTIONS.map(o => (
                <button
                  key={o.value}
                  onClick={() => { setSort(o.value); setShowSort(false); }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm transition-colors",
                    sort === o.value ? "font-bold text-green-700 bg-green-50" : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {o.value === sort && "✓ "}{o.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter chips */}
        <button
          onClick={() => toggleFilter("instock")}
          className={cn(
            "h-9 px-3 rounded-xl text-xs font-semibold border transition-all",
            filters.has("instock")
              ? "bg-green-500 border-green-500 text-white"
              : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
          )}
        >
          In stock
        </button>
        <button
          onClick={() => toggleFilter("has_discount")}
          className={cn(
            "h-9 px-3 rounded-xl text-xs font-semibold border transition-all",
            filters.has("has_discount")
              ? "bg-orange-500 border-orange-500 text-white"
              : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
          )}
        >
          On sale
        </button>

        {/* Clear filters */}
        {activeFilters > 0 && (
          <button onClick={() => setFilters(new Set())}
            className="ml-auto flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
            <X size={12} /> Clear
          </button>
        )}

        <span className="ml-auto text-xs text-gray-400 font-medium">{processed.length} items</span>
      </div>

      {/* Close sort on outside click */}
      {showSort && <div className="fixed inset-0 z-[5]" onClick={() => setShowSort(false)} />}

      {processed.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <span className="text-4xl mb-3">🔍</span>
          <p className="font-semibold text-gray-700">No products match your filters</p>
          <button onClick={() => setFilters(new Set())} className="mt-3 text-sm text-green-600 font-semibold">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {processed.map(p => (
            <ProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              price={p.price}
              mrp={p.mrp}
              unit={p.unit}
              images={p.images as string[]}
              stock={p.stock}
            />
          ))}
        </div>
      )}
    </div>
  );
}
