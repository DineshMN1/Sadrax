import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !["admin", "staff"].includes((session.user as { role?: string }).role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { updates } = await req.json() as {
    updates: { id: number; stock: number }[];
  };

  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  await Promise.all(
    updates.map(({ id, stock }) =>
      db.update(products)
        .set({ stock: Math.max(0, stock), updatedAt: new Date() })
        .where(eq(products.id, id))
    )
  );

  return NextResponse.json({ updated: updates.length });
}
