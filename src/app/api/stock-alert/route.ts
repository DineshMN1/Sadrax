import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stockAlerts } from "@/lib/db/schema";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Please log in to get notified" }, { status: 401 });

  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: "Missing product" }, { status: 400 });

  await db
    .insert(stockAlerts)
    .values({ productId: Number(productId), userId: session.user.id, notified: false })
    .onConflictDoNothing();

  return NextResponse.json({ success: true });
}
