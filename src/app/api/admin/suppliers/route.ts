import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { suppliers } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

function isAdmin(session: Awaited<ReturnType<typeof auth.api.getSession>>) {
  return session && ["admin", "staff"].includes((session.user as { role?: string }).role ?? "");
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rows = await db.select().from(suppliers).orderBy(desc(suppliers.id));
  return NextResponse.json({ suppliers: rows });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name, phone, notes } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const [supplier] = await db.insert(suppliers).values({ name, phone: phone ?? null, notes: notes ?? null, active: true }).returning();
  return NextResponse.json({ supplier });
}
