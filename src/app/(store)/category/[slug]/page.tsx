import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { ChevronLeft } from "lucide-react";
import { SearchBar } from "@/components/store/search-bar";
import { db } from "@/lib/db";
import { products, categories } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { CategoryProducts } from "./category-products";
import { getCategoryEmoji } from "@/lib/category-emoji";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [cat] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return { title: cat ? `${cat.name} — Sadrax` : "Category" };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [cat] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  if (!cat) notFound();

  const [items, allCats, counts] = await Promise.all([
    db.select().from(products).where(and(eq(products.categoryId, cat.id), eq(products.active, true))),
    db.select({ id: categories.id, name: categories.name, slug: categories.slug, image: categories.image })
      .from(categories).where(eq(categories.active, true)).orderBy(categories.order),
    db.select({ categoryId: products.categoryId, n: count() })
      .from(products).where(eq(products.active, true)).groupBy(products.categoryId),
  ]);

  const countMap = new Map(counts.map(c => [c.categoryId, c.n]));
  // Rail shows only non-empty categories (always include the one being viewed)
  const railCats = allCats.filter(c => c.id === cat.id || (countMap.get(c.id) ?? 0) > 0);

  return (
    <div>
      {/* Sticky header */}
      <div className="sticky top-0 z-20 glass border-b border-gray-100/80 px-4 pt-3 pb-3 space-y-3">
        <div className="flex items-center gap-3">
          <Link href="/categories" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shrink-0">
            <ChevronLeft size={20} className="text-gray-700" />
          </Link>
          <div className="w-8 h-8 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0 flex items-center justify-center">
            {cat.image
              ? <Image src={cat.image} alt={cat.name} width={32} height={32} className="w-full h-full object-cover" />
              : <span className="text-lg">{getCategoryEmoji(cat.slug)}</span>}
          </div>
          <h1 className="text-lg font-extrabold text-gray-900 flex-1 min-w-0 truncate">{cat.name}</h1>
          <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full shrink-0">{items.length}</span>
        </div>
        <Suspense><SearchBar /></Suspense>
      </div>

      {/* Mobile category chips — quick switch */}
      <div className="md:hidden flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none [&::-webkit-scrollbar]:hidden border-b border-gray-100/80">
        {railCats.map(c => {
          const active = c.slug === cat.slug;
          return (
            <Link key={c.id} href={`/category/${c.slug}`}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${active ? "bg-green-600 border-green-600 text-white" : "bg-white border-gray-200 text-gray-600"}`}>
              <span className="text-sm">{getCategoryEmoji(c.slug)}</span>{c.name}
            </Link>
          );
        })}
      </div>

      {/* Desktop: left rail + products | Mobile: products only */}
      <div className="md:flex md:gap-5 md:px-5 md:py-5">
        {/* Left rail */}
        <aside className="hidden md:block w-52 shrink-0">
          <div className="sticky top-24 space-y-1">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">Categories</p>
            {railCats.map(c => {
              const active = c.slug === cat.slug;
              return (
                <Link key={c.id} href={`/category/${c.slug}`}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${active ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50"}`}>
                  <span className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                    {c.image
                      ? <Image src={c.image} alt={c.name} width={32} height={32} className="w-full h-full object-cover" />
                      : <span className="text-base">{getCategoryEmoji(c.slug)}</span>}
                  </span>
                  <span className="flex-1 min-w-0 truncate">{c.name}</span>
                  <span className={`text-[11px] ${active ? "text-green-500" : "text-gray-300"}`}>{countMap.get(c.id) ?? 0}</span>
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1 min-w-0 px-4 py-4 md:p-0">
          <CategoryProducts initialItems={items} />
        </div>
      </div>
    </div>
  );
}
