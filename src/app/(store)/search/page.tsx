import { ProductCard } from "@/components/store/product-card";
import { SearchBar } from "@/components/store/search-bar";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { ilike, eq, and, or } from "drizzle-orm";
import { Suspense } from "react";

async function SearchResults({ query }: { query: string }) {
  if (!query.trim()) return null;

  const results = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.active, true),
        or(
          ilike(products.name, `%${query}%`),
          ilike(products.description ?? "", `%${query}%`)
        )
      )
    )
    .limit(40);

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <span className="text-5xl mb-4">🔍</span>
        <h3 className="font-semibold text-gray-700">No results for &quot;{query}&quot;</h3>
        <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-gray-400 mb-3">{results.length} result{results.length !== 1 ? "s" : ""} for &quot;{query}&quot;</p>
      <div className="grid grid-cols-2 gap-3">
        {results.map((p) => (
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
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;

  return (
    <div>
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 pt-4 pb-3">
        <Suspense><SearchBar /></Suspense>
      </div>
      <div className="px-4 py-4">
        <Suspense fallback={<div className="grid grid-cols-2 gap-3">{Array(6).fill(0).map((_, i) => <div key={i} className="aspect-[3/4] bg-gray-100 rounded-2xl animate-pulse" />)}</div>}>
          <SearchResults query={q} />
        </Suspense>
      </div>
    </div>
  );
}
