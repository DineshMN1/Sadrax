import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
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
  if (!cat) return { title: "Category" };
  const desc = `Buy ${cat.name} online in Sadras & Kalpakam. Fresh stock, fast local delivery from Sadrax grocery store.`;
  return {
    title: cat.name,
    description: desc,
    alternates: { canonical: `/category/${slug}` },
    openGraph: {
      title: `${cat.name} — Sadrax`,
      description: desc,
      url: `/category/${slug}`,
      ...(cat.image ? { images: [{ url: cat.image, width: 400, height: 400, alt: cat.name }] } : {}),
    },
    twitter: {
      card: "summary",
      title: `${cat.name} — Sadrax`,
      description: desc,
    },
  };
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
  const railCats = allCats.filter(c => c.id === cat.id || (countMap.get(c.id) ?? 0) > 0);

  return (
    <div className="flex flex-col h-full">
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

      {/* Rail + Products — two-column on ALL screen sizes */}
      <div className="flex flex-1 min-h-0">

        {/* Left rail — narrow on mobile, wider on desktop */}
        <aside className="w-16 md:w-52 shrink-0 border-r border-gray-100 bg-white overflow-y-auto sticky top-28 self-start max-h-[calc(100dvh-7rem)] pb-28">
          <p className="hidden md:block text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 pt-3 pb-1">Categories</p>
          {railCats.map(c => {
            const active = c.slug === cat.slug;
            return (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className={`flex flex-col md:flex-row items-center md:items-center gap-0.5 md:gap-2.5 px-1.5 md:px-3 py-2.5 md:py-2 transition-colors border-l-2 ${
                  active
                    ? "border-green-500 bg-green-50"
                    : "border-transparent hover:bg-gray-50"
                }`}
              >
                {/* Icon */}
                <span className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  {c.image
                    ? <Image src={c.image} alt={c.name} width={32} height={32} className="w-full h-full object-cover" />
                    : <span className="text-base">{getCategoryEmoji(c.slug)}</span>}
                </span>
                {/* Name */}
                <span className={`text-center md:text-left text-[10px] md:text-sm leading-tight line-clamp-2 md:flex-1 md:min-w-0 md:truncate ${
                  active ? "font-bold text-green-700" : "font-medium text-gray-600"
                }`}>
                  {c.name}
                </span>
                {/* Count — desktop only */}
                <span className={`hidden md:block text-[11px] ${active ? "text-green-500" : "text-gray-300"}`}>
                  {countMap.get(c.id) ?? 0}
                </span>
              </Link>
            );
          })}
        </aside>

        {/* Products */}
        <div className="flex-1 min-w-0 px-3 py-3 md:px-5 md:py-5">
          <CategoryProducts initialItems={items} />
        </div>

      </div>
    </div>
  );
}
