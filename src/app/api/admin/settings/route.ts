import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { storeSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

function isAdmin(session: Awaited<ReturnType<typeof auth.api.getSession>>) {
  return session && ["admin", "staff"].includes((session.user as { role?: string }).role ?? "");
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await db.select().from(storeSettings);
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const entries = Object.entries(body);

  for (const [key, value] of entries) {
    await db
      .insert(storeSettings)
      .values({ key, value: String(value), updatedAt: new Date() })
      .onConflictDoUpdate({ target: storeSettings.key, set: { value: String(value), updatedAt: new Date() } });
  }

  return NextResponse.json({ success: true });
}
