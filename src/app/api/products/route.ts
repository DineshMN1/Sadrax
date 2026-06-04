import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, categories } from "@/lib/db/schema";
import { eq, and, ilike, desc, sql, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const categoryId = searchParams.get("category");
  const search     = searchParams.get("q");
  const featured   = searchParams.get("featured");
  const idsParam   = searchParams.get("ids");
  const limit      = Math.min(Number(searchParams.get("limit") ?? 20), 100);
  const offset     = Number(searchParams.get("offset") ?? 0);

  // Fetch specific IDs (e.g. wishlist)
  if (idsParam) {
    const ids = idsParam.split(",").map(Number).filter(Boolean).slice(0, 50);
    if (ids.length === 0) return NextResponse.json({ products: [] });
    const rows = await db.select().from(products).where(and(inArray(products.id, ids), eq(products.active, true)));
    return NextResponse.json({ products: rows });
  }

  const conditions = [eq(products.active, true)];
  if (categoryId) conditions.push(eq(products.categoryId, Number(categoryId)));
  if (featured)   conditions.push(eq(products.featured, true));
  if (search)     conditions.push(ilike(products.name, `%${search}%`));

  const rows = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(desc(products.orderCount))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ products: rows });
}
