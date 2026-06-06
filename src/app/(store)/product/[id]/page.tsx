import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProductBackButton } from "./product-detail-client";
import { db } from "@/lib/db";
import { products, categories } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { ProductCard } from "@/components/store/product-card";
import { ProductDetailClient } from "./product-detail-client";
import { FrequentlyBought } from "@/components/store/frequently-bought";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [p] = await db.select().from(products).where(eq(products.id, Number(id))).limit(1);
  if (!p) return { title: "Product — Sadrax" };
  const desc = p.description ?? `Buy ${p.name} online from Sadrax grocery store.`;
  const image = (p.images as string[])?.[0] ?? null;
  return {
    title: `${p.name} — Sadrax`,
    description: desc,
    openGraph: {
      title: p.name,
      description: desc,
      ...(image ? { images: [{ url: image, width: 400, height: 400, alt: p.name }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: p.name,
      description: desc,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, Number(id)), eq(products.active, true)))
    .limit(1);

  if (!product) notFound();

  // Fetch category + related products
  const [category, related] = await Promise.all([
    product.categoryId
      ? db.select().from(categories).where(eq(categories.id, product.categoryId)).limit(1)
      : Promise.resolve([]),
    product.categoryId
      ? db.select().from(products)
          .where(and(
            eq(products.categoryId, product.categoryId),
            eq(products.active, true),
            ne(products.id, product.id)
          ))
          .limit(6)
      : Promise.resolve([]),
  ]);

  const discount = product.mrp && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : null;

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="sticky top-0 z-20 glass border-b border-gray-100/80 px-4 py-3 flex items-center gap-3">
        <ProductBackButton />
        {category[0] && (
          <Link href={`/category/${category[0].slug}`} className="text-xs font-semibold text-gray-400 hover:text-green-600 transition-colors">
            {category[0].name}
          </Link>
        )}
      </div>

      {/* Client part: carousel + add-to-cart */}
      <ProductDetailClient
        id={product.id}
        name={product.name}
        price={product.price}
        mrp={product.mrp}
        unit={product.unit}
        stock={product.stock}
        images={(product.images as string[]) ?? []}
        description={product.description}
        discount={discount}
        category={category[0] ?? null}
      />

      {/* Frequently bought together (co-purchase) */}
      <FrequentlyBought productId={product.id} />

      {/* Related products */}
      {related.length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="text-base font-extrabold text-gray-900 mb-3">
            {category[0] ? `More from ${category[0].name}` : "You might also like"}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {related.map(p => (
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
      )}
    </div>
  );
}
