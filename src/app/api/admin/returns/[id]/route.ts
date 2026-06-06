import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { returnRequests, orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendPushToUser } from "@/lib/push";

function isAdmin(session: Awaited<ReturnType<typeof auth.api.getSession>>) {
  return session && ["admin", "staff"].includes((session.user as { role?: string }).role ?? "");
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { status, resolution, adminNote, refundAmount } = await req.json();

  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (status === "approved" && !["refund", "replacement"].includes(resolution)) {
    return NextResponse.json({ error: "Choose refund or replacement" }, { status: 400 });
  }

  const [request] = await db
    .update(returnRequests)
    .set({
      status,
      resolution: status === "approved" ? resolution : null,
      refundAmount: status === "approved" && resolution === "refund" ? (refundAmount ?? null) : null,
      adminNote: adminNote ?? null,
      updatedAt: new Date(),
    })
    .where(eq(returnRequests.id, Number(id)))
    .returning();

  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Notify the customer
  const [order] = await db.select().from(orders).where(eq(orders.id, request.orderId)).limit(1);
  const orderNo = order?.orderNumber ?? request.orderId;
  const push = status === "approved"
    ? {
        title: "Return approved ✅",
        body: resolution === "replacement"
          ? `We'll arrange a replacement for order #${orderNo}.`
          : `A refund for order #${orderNo} has been approved.`,
      }
    : {
        title: "Return request update",
        body: `Your request for order #${orderNo} was not approved.${adminNote ? " " + adminNote : ""}`,
      };
  sendPushToUser(request.userId, { ...push, url: `/orders/${request.orderId}` }).catch(() => {});

  return NextResponse.json({ request });
}
