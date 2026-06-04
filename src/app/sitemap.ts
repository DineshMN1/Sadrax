import { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { products, categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://sadrax.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cats, prods] = await Promise.all([
    db.select({ slug: categories.slug }).from(categories).where(eq(categories.active, true)),
    db.select({ id: products.id, updatedAt: products.updatedAt }).from(products).where(eq(products.active, true)),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE,               lastModified: new Date(), changeFrequency: "daily",   priority: 1 },
    { url: `${BASE}/categories`, lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/offers`,    lastModified: new Date(), changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/search`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = cats.map(c => ({
    url: `${BASE}/category/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const productRoutes: MetadataRoute.Sitemap = prods.map(p => ({
    url: `${BASE}/product/${p.id}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
