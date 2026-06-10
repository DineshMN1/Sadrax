import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { productRequests, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({
      id: productRequests.id,
      productName: productRequests.productName,
      note: productRequests.note,
      status: productRequests.status,
      createdAt: productRequests.createdAt,
      userName: users.name,
      userPhone: users.phone,
      userEmail: users.email,
    })
    .from(productRequests)
    .leftJoin(users, eq(productRequests.userId, users.id))
    .orderBy(desc(productRequests.createdAt))
    .limit(200);

  return NextResponse.json({ requests: rows });
}
