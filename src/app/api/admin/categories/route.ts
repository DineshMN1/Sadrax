import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

function isAdmin(session: Awaited<ReturnType<typeof auth.api.getSession>>) {
  return session && ["admin", "staff"].includes((session.user as { role?: string }).role ?? "");
}

export async function GET() {
  const rows = await db.select().from(categories).orderBy(categories.order);
  return NextResponse.json({ categories: rows });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, slug, order, image } = body;

  if (!name || !slug) return NextResponse.json({ error: "name and slug required" }, { status: 400 });

  const [cat] = await db.insert(categories).values({ name, slug, order: order ?? 0, image, active: true }).returning();
  return NextResponse.json({ category: cat });
}
