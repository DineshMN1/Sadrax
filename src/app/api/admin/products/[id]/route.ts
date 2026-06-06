import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logAudit, diffSummary } from "@/lib/audit";
import { notifyBackInStock } from "@/lib/stock-alerts";

function isAdmin(session: Awaited<ReturnType<typeof auth.api.getSession>>) {
  return session && ["admin", "staff"].includes((session.user as { role?: string }).role ?? "");
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const [product] = await db.select().from(products).where(eq(products.id, Number(id))).limit(1);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const [before] = await db.select().from(products).where(eq(products.id, Number(id))).limit(1);

  const [product] = await db
    .update(products)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(products.id, Number(id)))
    .returning();

  if (before) {
    const summary = diffSummary(before as Record<string, unknown>, body, Object.keys(body)) || "updated";
    logAudit(req, session, { action: "update", entity: "product", entityId: id, summary: `${before.name}: ${summary}` });
    // Back-in-stock alerts when stock crosses 0 → positive
    if (before.stock === 0 && typeof body.stock === "number" && body.stock > 0) {
      notifyBackInStock(product.id, product.name).catch(() => {});
    }
  }

  return NextResponse.json({ product });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const [before] = await db.select().from(products).where(eq(products.id, Number(id))).limit(1);
  await db.delete(products).where(eq(products.id, Number(id)));
  logAudit(req, session, { action: "delete", entity: "product", entityId: id, summary: `Deleted ${before?.name ?? `#${id}`}` });
  return NextResponse.json({ success: true });
}
