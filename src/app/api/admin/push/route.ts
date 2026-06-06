import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { sendPushToAll } from "@/lib/push";

function isAdmin(session: Awaited<ReturnType<typeof auth.api.getSession>>) {
  return session && ["admin", "staff"].includes((session.user as { role?: string }).role ?? "");
}

// How many devices / distinct users are reachable
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [row] = await db
    .select({
      devices: sql<number>`count(*)::int`,
      users: sql<number>`count(distinct ${pushSubscriptions.userId})::int`,
    })
    .from(pushSubscriptions);

  return NextResponse.json({ devices: row?.devices ?? 0, users: row?.users ?? 0 });
}

// Broadcast a notification to every subscribed device
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, body, url } = await req.json();

  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
  }
  if (title.length > 80 || body.length > 180) {
    return NextResponse.json({ error: "Title or message is too long" }, { status: 400 });
  }

  const result = await sendPushToAll({
    title: title.trim(),
    body: body.trim(),
    url: url?.trim() || "/",
  });

  return NextResponse.json(result);
}
