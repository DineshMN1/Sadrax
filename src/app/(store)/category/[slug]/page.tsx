import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft } from "lucide-react";
import { ProductCard } from "@/components/store/product-card";
import { SearchBar } from "@/components/store/search-bar";
import { db } from "@/lib/db";
import { products, categories } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [cat] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return { title: cat ? `${cat.name} — Sadrax` : "Category" };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [cat] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  if (!cat) notFound();

  const items = await db
    .select()
    .from(products)
    .where(and(eq(products.categoryId, cat.id), eq(products.active, true)));

  return (
    <div>
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">{cat.name}</h1>
          <span className="ml-auto text-xs text-gray-400">{items.length} items</span>
        </div>
        <Suspense><SearchBar /></Suspense>
      </div>

      <div className="px-4 py-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <span className="text-5xl mb-4">📦</span>
            <h3 className="font-semibold text-gray-700">Nothing here yet</h3>
            <p className="text-sm text-gray-400 mt-1">Products coming soon</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((p) => (
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
    </div>
  );
}
