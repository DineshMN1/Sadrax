import { ProductCard } from "@/components/store/product-card";
import { SearchBar } from "@/components/store/search-bar";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { ilike, eq, and, or } from "drizzle-orm";
import { Suspense } from "react";

async function SearchResults({ query }: { query: string }) {
  if (!query.trim()) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <span className="text-5xl mb-4">🔍</span>
        <h3 className="font-bold text-gray-700">Search for groceries</h3>
        <p className="text-sm text-gray-400 mt-1">Type above to find what you need</p>
      </div>
    );
  }

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
        <span className="text-5xl mb-4">😕</span>
        <h3 className="font-bold text-gray-700">No results for &quot;{query}&quot;</h3>
        <p className="text-sm text-gray-400 mt-1.5">Try a different search term or browse categories</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 mb-3">
        {results.length} result{results.length !== 1 ? "s" : ""} for &quot;<span className="text-gray-700">{query}</span>&quot;
      </p>
      <div className="grid grid-cols-2 gap-3">
        {results.map(p => (
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
      <div className="sticky top-0 z-20 glass border-b border-gray-100/80 px-4 pt-4 pb-3">
        <Suspense><SearchBar /></Suspense>
      </div>
      <div className="px-4 py-4">
        <Suspense fallback={
          <div className="grid grid-cols-2 gap-3">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="aspect-square skeleton" />
                <div className="p-2.5 space-y-2">
                  <div className="h-3 w-12 skeleton rounded" />
                  <div className="h-4 w-full skeleton rounded" />
                  <div className="h-8 skeleton rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        }>
          <SearchResults query={q} />
        </Suspense>
      </div>
    </div>
  );
}
