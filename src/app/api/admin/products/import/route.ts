import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { products, categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { toSlug } from "@/lib/utils";
import Papa from "papaparse";

function isAdmin(session: Awaited<ReturnType<typeof auth.api.getSession>>) {
  return session && ["admin", "staff"].includes((session.user as { role?: string }).role ?? "");
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const text = await file.text();
  const { data } = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });

  // Fetch existing categories for name lookup
  const allCategories = await db.select().from(categories);
  const catMap = new Map(allCategories.map((c) => [c.name.toLowerCase(), c.id]));

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of data) {
    try {
      const name = row.name?.trim();
      if (!name) { skipped++; continue; }

      const price = Math.round(parseFloat(row.price ?? "0") * 100);
      const mrp = row.mrp ? Math.round(parseFloat(row.mrp) * 100) : null;
      const slug = row.slug?.trim() || toSlug(name);
      const stock = parseInt(row.stock ?? "0") || 0;
      const categoryId = row.category ? catMap.get(row.category.toLowerCase().trim()) ?? null : null;
      const featured = row.featured?.toLowerCase() === "true";

      await db
        .insert(products)
        .values({ name, slug, price, mrp, unit: row.unit?.trim() || null, stock, categoryId, description: row.description?.trim() || null, featured, active: true, images: [] })
        .onConflictDoNothing();

      created++;
    } catch (err) {
      errors.push(`Row "${row.name}": ${err instanceof Error ? err.message : "error"}`);
    }
  }

  return NextResponse.json({ created, skipped, errors });
}
