import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, orderItems, addresses } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { formatPrice, STATUS_LABELS, STATUS_COLORS, ORDER_STATUSES, type OrderStatus } from "@/lib/utils";
import { CheckCircle2, Package, Truck, MapPin, Clock } from "lucide-react";

const TRACKING_STEPS: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: "pending", label: "Order Placed", icon: Clock },
  { status: "accepted", label: "Accepted", icon: CheckCircle2 },
  { status: "packed", label: "Packed", icon: Package },
  { status: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { status: "delivered", label: "Delivered", icon: CheckCircle2 },
];

export default async function OrderDetailPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const { id } = await params;
  const { placed } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, Number(id)), eq(orders.userId, session.user.id)))
    .limit(1);

  if (!order) notFound();

  const [items, address] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    order.addressId ? db.select().from(addresses).where(eq(addresses.id, order.addressId)).limit(1) : Promise.resolve([]),
  ]);

  const currentStatusIdx = TRACKING_STEPS.findIndex((s) => s.status === order.status);
  const isTerminal = order.status === "rejected" || order.status === "cancelled";

  return (
    <div className="pb-6">
      {placed && (
        <div className="mx-4 mt-4 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 className="text-green-600" size={24} />
          <div>
            <p className="font-bold text-green-800">Order placed!</p>
            <p className="text-xs text-green-600">We&apos;ll send you an SMS when it&apos;s accepted.</p>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href="/orders" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100">←</Link>
        <div>
          <h1 className="text-base font-bold text-gray-900">Order #{order.orderNumber}</h1>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status as OrderStatus]}`}>
            {STATUS_LABELS[order.status as OrderStatus]}
          </span>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Tracking */}
        {!isTerminal && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Order Tracking</h2>
            <div className="relative">
              {TRACKING_STEPS.map((step, idx) => {
                const done = idx <= currentStatusIdx;
                const Icon = step.icon;
                return (
                  <div key={step.status} className="flex items-start gap-3 relative">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 ${done ? "bg-green-500" : "bg-gray-100"}`}>
                        <Icon size={14} className={done ? "text-white" : "text-gray-400"} />
                      </div>
                      {idx < TRACKING_STEPS.length - 1 && (
                        <div className={`w-0.5 h-8 ${idx < currentStatusIdx ? "bg-green-400" : "bg-gray-200"}`} />
                      )}
                    </div>
                    <p className={`text-sm font-medium pt-1 ${done ? "text-gray-900" : "text-gray-400"}`}>{step.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Items</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.productName} × {item.quantity}</span>
                <span className="font-medium">{formatPrice(item.total)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bill */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-600">Delivery</span><span>{order.deliveryFee === 0 ? <span className="text-green-600 font-semibold">FREE</span> : formatPrice(order.deliveryFee)}</span></div>
          {order.discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>-{formatPrice(order.discount)}</span></div>}
          <div className="border-t border-gray-100 pt-2 flex justify-between font-bold"><span>Total</span><span>{formatPrice(order.total)}</span></div>
          <div className="flex justify-between text-xs text-gray-400 pt-1"><span>Payment</span><span className="uppercase">{order.paymentMethod}</span></div>
        </div>

        {/* Address */}
        {address[0] && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={14} className="text-green-600" />
              <h2 className="text-sm font-bold text-gray-900">Delivery Address</h2>
            </div>
            <p className="text-sm font-semibold text-gray-800">{address[0].name}</p>
            <p className="text-sm text-gray-600">{address[0].line1}{address[0].line2 ? `, ${address[0].line2}` : ""}</p>
            <p className="text-sm text-gray-500">{address[0].city} — {address[0].pincode}</p>
            <p className="text-sm text-gray-500 mt-0.5">{address[0].phone}</p>
          </div>
        )}
      </div>
    </div>
  );
}
