export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { CategoryRail } from "./category-rail";

export default async function CategoryLayout({ children }: { children: React.ReactNode }) {
  const [allCats, counts] = await Promise.all([
    db
      .select({ id: categories.id, name: categories.name, slug: categories.slug, image: categories.image })
      .from(categories)
      .where(eq(categories.active, true))
      .orderBy(categories.order),
    db
      .select({ categoryId: products.categoryId, n: count() })
      .from(products)
      .where(eq(products.active, true))
      .groupBy(products.categoryId),
  ]);

  const countMap = Object.fromEntries(counts.map(c => [c.categoryId ?? -1, c.n]));
  const railCats = allCats.filter(c => (countMap[c.id] ?? 0) > 0);

  return (
    <div className="flex h-full min-h-0">
      {/* Rail — lives in the layout so it never unmounts between category navigations */}
      <CategoryRail cats={railCats} countMap={countMap} />

      {/* Page-specific content: sticky sub-header + products */}
      <div className="flex-1 min-w-0 flex flex-col">
        {children}
      </div>
    </div>
  );
}
