import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, categories } from "@/lib/db/schema";
import { eq, and, or, ilike, desc, sql, inArray } from "drizzle-orm";
import { expandSynonyms } from "@/lib/search-synonyms";

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

  // Fuzzy, synonym-aware search: name/brand ILIKE across synonym terms, OR a
  // trigram similarity match (typo tolerance), ranked by closeness.
  let orderBy = desc(products.orderCount);
  if (search) {
    const terms = expandSynonyms(search);
    const likeConds = terms.flatMap((t) => [ilike(products.name, `%${t}%`), ilike(products.brand, `%${t}%`)]);
    conditions.push(or(...likeConds, sql`similarity(${products.name}, ${search}) > 0.25`)!);
    orderBy = sql`similarity(${products.name}, ${search}) DESC, ${products.orderCount} DESC` as typeof orderBy;
  }

  const rows = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ products: rows });
}
