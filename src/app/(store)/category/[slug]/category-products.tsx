"use client";

import { useState, useMemo } from "react";
import { ProductCard } from "@/components/store/product-card";
import { ArrowUpDown, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type SortKey = "popular" | "price_asc" | "price_desc" | "discount";
type FilterKey = "instock" | "has_discount";
type Variant = { unit: string; price: number; mrp: number | null; stock: number; image?: string | null };

interface Product {
  id: number;
  name: string;
  price: number;
  mrp: number | null;
  unit: string | null;
  images: unknown;
  stock: number;
  orderCount: number;
  brand?: string | null;
  veg?: string | null;
  variants?: Variant[] | null;
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "popular",    label: "Popular"           },
  { value: "price_asc",  label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "discount",   label: "Highest Discount"  },
];

export function CategoryProducts({ initialItems }: { initialItems: Product[] }) {
  const [sort, setSort]         = useState<SortKey>("popular");
  const [filters, setFilters]   = useState<Set<FilterKey>>(new Set());
  const [showSort, setShowSort] = useState(false);
  const [brand, setBrand]       = useState<string>("all");

  const brands = useMemo(
    () => Array.from(new Set(initialItems.map(p => p.brand).filter((b): b is string => !!b))).sort(),
    [initialItems]
  );

  const toggleFilter = (f: FilterKey) =>
    setFilters(prev => {
      const next = new Set(prev);
      next.has(f) ? next.delete(f) : next.add(f);
      return next;
    });

  const processed = useMemo(() => {
    let list = [...initialItems];

    // For variant products, consider any variant in-stock as in-stock
    const hasStock = (p: Product) =>
      p.variants && p.variants.length > 0
        ? p.variants.some(v => v.stock > 0)
        : p.stock > 0;

    const hasDiscount = (p: Product) =>
      p.variants && p.variants.length > 0
        ? p.variants.some(v => v.mrp && v.mrp > v.price)
        : !!(p.mrp && p.mrp > p.price);

    if (filters.has("instock"))      list = list.filter(hasStock);
    if (filters.has("has_discount")) list = list.filter(hasDiscount);
    if (brand !== "all")             list = list.filter(p => p.brand === brand);

    const effectivePrice = (p: Product) =>
      p.variants && p.variants.length > 0 ? (p.variants[0]?.price ?? p.price) : p.price;
    const effectiveMrp = (p: Product) =>
      p.variants && p.variants.length > 0 ? (p.variants[0]?.mrp ?? p.mrp) : p.mrp;

    switch (sort) {
      case "price_asc":  list.sort((a, b) => effectivePrice(a) - effectivePrice(b)); break;
      case "price_desc": list.sort((a, b) => effectivePrice(b) - effectivePrice(a)); break;
      case "discount":   list.sort((a, b) => {
        const ep = (p: Product) => effectivePrice(p);
        const em = (p: Product) => effectiveMrp(p);
        const da = em(a) && em(a)! > ep(a) ? (em(a)! - ep(a)) / em(a)! : 0;
        const db = em(b) && em(b)! > ep(b) ? (em(b)! - ep(b)) / em(b)! : 0;
        return db - da;
      }); break;
      default: list.sort((a, b) => b.orderCount - a.orderCount);
    }
    return list;
  }, [initialItems, sort, filters, brand]);

  const activeFilters = filters.size;

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
      <div className="mb-3">
        <div className="flex items-center gap-2">

          {/* Sort — outside the scroll container so the dropdown isn't clipped */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowSort(v => !v)}
              className={cn(
                "relative flex items-center gap-1 h-9 w-9 justify-center rounded-xl border transition-all",
                sort !== "popular"
                  ? "bg-gray-900 border-gray-900 text-white"
                  : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
              )}
            >
              <ArrowUpDown size={15} />
              {sort !== "popular" && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white" />
              )}
            </button>
            {showSort && (
              <div className="absolute top-11 left-0 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-30 w-44 animate-slide-up">
                {SORT_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    onClick={() => { setSort(o.value); setShowSort(false); }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2",
                      sort === o.value ? "font-bold text-green-700 bg-green-50" : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    {sort === o.value ? <Check size={13} className="shrink-0" /> : <span className="w-3.25" />}
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Scrollable filter pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">

          {/* Divider */}
          <div className="w-px h-5 bg-gray-200 shrink-0" />

          {/* In stock */}
          <button
            onClick={() => toggleFilter("instock")}
            className={cn(
              "shrink-0 h-9 px-3 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap",
              filters.has("instock")
                ? "bg-green-500 border-green-500 text-white"
                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
            )}
          >
            In stock
          </button>

          {/* On sale */}
          <button
            onClick={() => toggleFilter("has_discount")}
            className={cn(
              "shrink-0 h-9 px-3 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap",
              filters.has("has_discount")
                ? "bg-orange-500 border-orange-500 text-white"
                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
            )}
          >
            On sale
          </button>

          {/* Brand pills */}
          {brands.length > 0 && (
            <>
              <div className="w-px h-5 bg-gray-200 shrink-0" />
              {brands.map(b => (
                <button
                  key={b}
                  onClick={() => setBrand(brand === b ? "all" : b)}
                  className={cn(
                    "shrink-0 h-9 px-3 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap",
                    brand === b
                      ? "bg-violet-500 border-violet-500 text-white"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  {b}
                </button>
              ))}
            </>
          )}
          </div>{/* end scrollable pills */}
        </div>

        <div className="flex items-center justify-between mt-2 px-0.5">
          <span className="text-xs text-gray-400 font-medium">{processed.length} item{processed.length !== 1 ? "s" : ""}</span>
          {(activeFilters > 0 || brand !== "all" || sort !== "popular") && (
            <button
              onClick={() => { setFilters(new Set()); setBrand("all"); setSort("popular"); }}
              className="flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-500 transition-colors"
            >
              <X size={11} /> Reset all
            </button>
          )}
        </div>
      </div>

      {/* Close sort on outside click */}
      {showSort && <div className="fixed inset-0 z-5" onClick={() => setShowSort(false)} />}

      {processed.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <span className="text-4xl mb-3">🔍</span>
          <p className="font-semibold text-gray-700">No products match your filters</p>
          <button onClick={() => setFilters(new Set())} className="mt-3 text-sm text-green-600 font-semibold">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
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
              veg={p.veg}
              variants={p.variants && p.variants.length > 1 ? p.variants : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
