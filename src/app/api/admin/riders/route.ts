import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deliveryPersons } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

function isAdmin(session: Awaited<ReturnType<typeof auth.api.getSession>>) {
  return session && ["admin", "staff"].includes((session.user as { role?: string }).role ?? "");
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rows = await db.select().from(deliveryPersons).orderBy(desc(deliveryPersons.id));
  return NextResponse.json({ riders: rows });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name, phone } = await req.json();
  if (!name || !phone) return NextResponse.json({ error: "Name and phone required" }, { status: 400 });
  const [rider] = await db.insert(deliveryPersons).values({ name, phone, active: true }).returning();
  return NextResponse.json({ rider });
}
