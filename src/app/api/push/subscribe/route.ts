import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { endpoint, p256dh, auth: authKey } = await req.json();
  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  // Upsert — replace if same endpoint exists
  await db
    .insert(pushSubscriptions)
    .values({ userId: session.user.id, endpoint, p256dh, auth: authKey })
    .onConflictDoNothing();

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { endpoint } = await req.json();
  if (endpoint) {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  } else {
    // Delete all for this user
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, session.user.id));
  }

  return NextResponse.json({ success: true });
}
