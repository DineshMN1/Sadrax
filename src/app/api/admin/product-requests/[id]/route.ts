import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { productRequests } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const status = body.status;
  if (!["pending", "added", "declined"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await db
    .update(productRequests)
    .set({ status })
    .where(eq(productRequests.id, Number(id)));

  return NextResponse.json({ ok: true });
}
