import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { ChevronLeft } from "lucide-react";
import { SearchBar } from "@/components/store/search-bar";
import { db } from "@/lib/db";
import { products, categories } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { CategoryProducts } from "./category-products";
import { getCategoryEmoji } from "@/lib/category-emoji";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [cat] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return { title: cat ? `${cat.name} — Sadrax` : "Category" };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [cat] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  if (!cat) notFound();

  const items = await db
    .select()
    .from(products)
    .where(and(eq(products.categoryId, cat.id), eq(products.active, true)));

  return (
    <div>
      <div className="sticky top-0 z-20 glass border-b border-gray-100/80 px-4 pt-4 pb-3 space-y-3">
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

      <div className="px-4 py-4">
        <CategoryProducts initialItems={items} />
      </div>
    </div>
  );
}
