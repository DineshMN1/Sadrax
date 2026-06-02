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
  const { name, price, description, mrp, unit, stock, categoryId, images, active, featured } = body;

  if (!name || !price) return NextResponse.json({ error: "name and price required" }, { status: 400 });

  const slug = body.slug || toSlug(name);

  const [product] = await db
    .insert(products)
    .values({ name, slug, description, price, mrp: mrp ?? null, unit, stock: stock ?? 0, categoryId: categoryId ?? null, images: images ?? [], active: active ?? true, featured: featured ?? false })
    .returning();

  return NextResponse.json({ product });
}
