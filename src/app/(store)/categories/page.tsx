import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "All Categories",
  description: "Browse all grocery categories — vegetables, fruits, dairy, snacks, beverages and more. Shop from Sadras & Kalpakam's local store.",
  alternates: { canonical: "/categories" },
  openGraph: { title: "Shop by Category — Sadrax", description: "All grocery categories available for local delivery.", url: "/categories" },
};

import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { SearchBar } from "@/components/store/search-bar";
import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { ChevronRight } from "lucide-react";
import { getCategoryEmoji } from "@/lib/category-emoji";

async function getCategoriesWithCounts() {
  const cats = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug, image: categories.image, order: categories.order })
    .from(categories)
    .where(eq(categories.active, true))
    .orderBy(categories.order);

  const counts = await db
    .select({ categoryId: products.categoryId, count: count() })
    .from(products)
    .where(eq(products.active, true))
    .groupBy(products.categoryId);

  const countMap = new Map(counts.map(c => [c.categoryId, c.count]));
  // Only show categories that actually have products in the storefront
  return cats
    .map(c => ({ ...c, productCount: countMap.get(c.id) ?? 0 }))
    .filter(c => c.productCount > 0);
}

export default async function CategoriesPage() {
  const cats = await getCategoriesWithCounts();

  return (
    <div>
      <div className="sticky top-0 z-20 glass border-b border-gray-100/80 px-4 pt-4 pb-3 space-y-3">
        <h1 className="text-xl font-extrabold text-gray-900">All Categories</h1>
        <Suspense><SearchBar /></Suspense>
      </div>

      <div className="px-4 py-4">
        {cats.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[55vh] text-center">
            <span className="text-5xl mb-4">📦</span>
            <h3 className="font-semibold text-gray-700">No categories yet</h3>
            <p className="text-sm text-gray-400 mt-1">Add categories from the admin panel</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {cats.map(cat => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="group flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 hover:border-green-200 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 shrink-0 flex items-center justify-center border border-gray-100 group-hover:scale-105 transition-transform">
                  {cat.image ? (
                    <Image src={cat.image} alt={cat.name} width={48} height={48} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">{getCategoryEmoji(cat.slug)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 leading-tight">{cat.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {cat.productCount} item{cat.productCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-green-500 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
