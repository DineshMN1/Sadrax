import { db } from "@/lib/db";
import { products, categories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { ProductsManager } from "./products-manager";

export default async function ProductsPage() {
  const [rows, cats] = await Promise.all([
    db
      .select({ product: products, category: categories })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(desc(products.createdAt)),
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(categories.order),
  ]);

  const initial = rows.map(({ product: p, category: c }) => ({
    id: p.id,
    name: p.name,
    unit: p.unit,
    price: p.price,
    mrp: p.mrp,
    stock: p.stock,
    active: p.active,
    image: (p.images as string[])[0] ?? null,
    categoryId: p.categoryId,
    categoryName: c?.name ?? null,
    variantCount: (p.variants as unknown[])?.length ?? 0,
  }));

  return <ProductsManager initialProducts={initial} categories={cats} />;
}
