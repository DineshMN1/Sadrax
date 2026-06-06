import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { products, categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { toSlug } from "@/lib/utils";

function isAdmin(session: Awaited<ReturnType<typeof auth.api.getSession>>) {
  return session && ["admin", "staff"].includes((session.user as { role?: string }).role ?? "");
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await db
    .select({ product: products, category: categories })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id));

  return NextResponse.json({ products: rows });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, price, description, mrp, unit, stock, categoryId, images, active, featured, brand, veg, variantGroup, variants } = body;

  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const shared = {
    description, mrp: mrp ?? null, categoryId: categoryId ?? null,
    images: images ?? [], active: active ?? true, featured: featured ?? false,
    brand: brand ?? null, veg: veg ?? null,
  };

  // Uniquify a slug against existing products
  const taken = new Set((await db.select({ slug: products.slug }).from(products)).map((r) => r.slug));
  const uniqueSlug = (base: string) => {
    let s = base || "product", n = 1;
    while (taken.has(s)) s = `${base}-${++n}`;
    taken.add(s);
    return s;
  };

  // ── Multi-variant: one product per {unit, price, stock}, linked by group ──
  if (Array.isArray(variants) && variants.length > 0) {
    const group = `${toSlug(name)}-${Math.random().toString(36).slice(2, 7)}`;
    const valid = variants
      .map((v: { unit?: string; price?: number; stock?: number }) => ({
        unit: (v.unit ?? "").trim(),
        price: Math.round(Number(v.price) || 0),
        stock: Math.max(0, Math.round(Number(v.stock) || 0)),
      }))
      .filter((v) => v.unit && v.price > 0);
    if (valid.length === 0) return NextResponse.json({ error: "Each variant needs a size and a price" }, { status: 400 });

    const rows = valid.map((v) => ({
      name: `${name} ${v.unit}`,
      slug: uniqueSlug(toSlug(`${name}-${v.unit}`)),
      price: v.price, unit: v.unit, stock: v.stock, variantGroup: group, ...shared,
    }));
    const created = await db.insert(products).values(rows).returning();
    return NextResponse.json({ products: created, variantGroup: group });
  }

  // ── Single product ──
  if (!price) return NextResponse.json({ error: "price required" }, { status: 400 });
  const [product] = await db
    .insert(products)
    .values({ name, slug: uniqueSlug(body.slug || toSlug(name)), price, unit, stock: stock ?? 0, variantGroup: variantGroup ?? null, ...shared })
    .returning();

  return NextResponse.json({ product });
}
