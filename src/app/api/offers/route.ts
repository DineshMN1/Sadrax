import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { offers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Public — active offers for the storefront.
export async function GET() {
  const rows = await db.select().from(offers).where(eq(offers.active, true)).orderBy(offers.order, offers.id);
  const now = new Date();
  return NextResponse.json({ offers: rows.filter((o) => !o.expiresAt || o.expiresAt >= now) });
}
