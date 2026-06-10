import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { productRequests } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(productRequests)
    .where(eq(productRequests.userId, session.user.id))
    .orderBy(desc(productRequests.createdAt))
    .limit(50);

  return NextResponse.json({ requests: rows });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const productName = (body.productName ?? "").trim();
  if (!productName || productName.length > 200) {
    return NextResponse.json({ error: "Product name is required (max 200 chars)" }, { status: 400 });
  }
  const note = (body.note ?? "").trim().slice(0, 500) || null;

  const [row] = await db
    .insert(productRequests)
    .values({ userId: session.user.id, productName, note })
    .returning();

  return NextResponse.json({ request: row }, { status: 201 });
}
