import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { banners } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

const MAX_BANNERS = 5;

function isAdmin(session: Awaited<ReturnType<typeof auth.api.getSession>>) {
  return session && ["admin", "staff"].includes((session.user as { role?: string }).role ?? "");
}

export async function GET() {
  const rows = await db.select().from(banners).orderBy(banners.order, banners.id);
  return NextResponse.json({ banners: rows });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(banners);
  if (count >= MAX_BANNERS) {
    return NextResponse.json({ error: `You can add up to ${MAX_BANNERS} banners. Delete one to add another.` }, { status: 400 });
  }

  const body = await req.json();
  const { title, subtitle, badge, image, ctaText, ctaLink, theme, order, active } = body;

  if (!title && !image) {
    return NextResponse.json({ error: "Add a title or an image" }, { status: 400 });
  }

  const [banner] = await db
    .insert(banners)
    .values({
      title: title ?? null,
      subtitle: subtitle ?? null,
      badge: badge ?? null,
      image: image ?? null,
      ctaText: ctaText ?? null,
      ctaLink: ctaLink ?? null,
      theme: theme ?? "green",
      order: order ?? 0,
      active: active ?? true,
    })
    .returning();

  return NextResponse.json({ banner });
}
