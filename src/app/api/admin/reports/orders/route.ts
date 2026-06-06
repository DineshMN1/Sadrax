import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, users } from "@/lib/db/schema";
import { and, gte, lte, eq, desc } from "drizzle-orm";

function isAdmin(session: Awaited<ReturnType<typeof auth.api.getSession>>) {
  return session && ["admin", "staff"].includes((session.user as { role?: string }).role ?? "");
}

const csvCell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// Sales export as CSV. Optional ?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const conds = [];
  if (from) conds.push(gte(orders.createdAt, new Date(from)));
  if (to) { const t = new Date(to); t.setHours(23, 59, 59, 999); conds.push(lte(orders.createdAt, t)); }

  const rows = await db
    .select({
      orderNumber: orders.orderNumber, status: orders.status, paymentMethod: orders.paymentMethod,
      subtotal: orders.subtotal, deliveryFee: orders.deliveryFee, discount: orders.discount,
      tip: orders.tip, total: orders.total, couponCode: orders.couponCode,
      createdAt: orders.createdAt, customer: users.name, phone: users.phone,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(orders.createdAt));

  const header = ["Order", "Date", "Customer", "Phone", "Status", "Payment", "Subtotal", "Delivery", "Discount", "Tip", "Total", "Coupon"];
  const rupee = (p: number | null) => ((p ?? 0) / 100).toFixed(2);
  const lines = rows.map((r) => [
    r.orderNumber, new Date(r.createdAt).toISOString(), r.customer ?? "", r.phone ?? "",
    r.status, r.paymentMethod, rupee(r.subtotal), rupee(r.deliveryFee), rupee(r.discount),
    rupee(r.tip), rupee(r.total), r.couponCode ?? "",
  ].map(csvCell).join(","));

  const csv = [header.join(","), ...lines].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sadrax-sales${from ? `-${from}` : ""}${to ? `-${to}` : ""}.csv"`,
    },
  });
}
