import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, orderItems, addresses, storeSettings, returnRequests, deliveryPersons } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { formatPrice, STATUS_LABELS, STATUS_COLORS, type OrderStatus } from "@/lib/utils";
import { CheckCircle2, Package, Truck, MapPin, Clock, ChevronLeft, XCircle, Phone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { OrderActions } from "./order-actions";
import { InvoiceButton } from "./invoice-button";
import { FreeDeliveryPopper } from "@/components/store/free-delivery-popper";
import { RepeatOrder } from "./repeat-order";
import { ReturnRequest } from "./return-request";
import { canRequestReturn } from "@/lib/returns";
import { OrderStatusWatcher } from "@/components/store/notification-bell";

const STORE_PHONE = process.env.NEXT_PUBLIC_STORE_PHONE ?? "9876543210";

const TRACKING_STEPS = [
  { status: "pending",          label: "Order Placed",     icon: Clock,         desc: "We've received your order" },
  { status: "accepted",         label: "Accepted",         icon: CheckCircle2,  desc: "Store is preparing your items" },
  { status: "packed",           label: "Packed",           icon: Package,       desc: "Order is packed and ready" },
  { status: "out_for_delivery", label: "Out for Delivery", icon: Truck,         desc: "On the way to you!" },
  { status: "delivered",        label: "Delivered",        icon: CheckCircle2,  desc: "Enjoy your groceries!" },
] as const;

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
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

  const [items, addressRows, etaSetting, returnRows] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    order.addressId
      ? db.select().from(addresses).where(eq(addresses.id, order.addressId)).limit(1)
      : Promise.resolve([]),
    db.select().from(storeSettings).where(eq(storeSettings.key, "delivery_eta")).limit(1),
    db.select().from(returnRequests).where(eq(returnRequests.orderId, order.id)).limit(1),
  ]);
  const existingReturn = returnRows[0] ?? null;
  const rider = order.deliveryPersonId
    ? (await db.select().from(deliveryPersons).where(eq(deliveryPersons.id, order.deliveryPersonId)).limit(1))[0] ?? null
    : null;

  const eta = etaSetting[0]?.value ?? "15–25 min";
  const currentIdx = TRACKING_STEPS.findIndex(s => s.status === order.status);
  const isTerminal = ["rejected", "cancelled"].includes(order.status);

  return (
    <div className="pb-8">
      {/* Success banner */}
      {placed && (
        <div className="mx-4 mt-4 bg-linear-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3 animate-slide-up">
          <div className="w-11 h-11 bg-linear-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
            <CheckCircle2 className="text-white" size={20} />
          </div>
          <div>
            <p className="font-extrabold text-green-800 text-sm">Order placed! 🎉</p>
            <p className="text-xs text-green-600 mt-0.5">Estimated delivery: <strong>{eta}</strong></p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-20 glass border-b border-gray-100/80 px-4 py-3 flex items-center gap-3">
        <Link href="/orders" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
          <ChevronLeft size={20} className="text-gray-700" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-extrabold text-gray-900">Order #{order.orderNumber}</h1>
          <p className="text-xs text-gray-400 mt-0.5">{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</p>
        </div>
        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0 ${STATUS_COLORS[order.status as OrderStatus]}`}>
          {STATUS_LABELS[order.status as OrderStatus]}
        </span>
      </div>

      {/* Auto-register notification on status change */}
      <OrderStatusWatcher orderId={order.id} orderNumber={order.orderNumber} status={order.status} />

      <div className="px-4 py-4 space-y-4">
        {/* ETA chip (active orders) */}
        {!isTerminal && order.status !== "delivered" && (
          <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-2.5">
            <Clock size={14} className="text-blue-600 shrink-0" />
            <p className="text-xs font-semibold text-blue-800">
              {order.status === "out_for_delivery"
                ? "Almost there! On the way to you 🛵"
                : `Estimated delivery: ${eta}`}
            </p>
          </div>
        )}

        {/* Tracking */}
        {!isTerminal ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h2 className="text-sm font-extrabold text-gray-900 mb-4">Order Tracking</h2>
            <div className="space-y-0">
              {TRACKING_STEPS.map((step, idx) => {
                const done    = idx <= currentIdx;
                const current = idx === currentIdx;
                const Icon    = step.icon;
                return (
                  <div key={step.status} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all duration-300 ${
                        current ? "bg-linear-to-br from-green-500 to-emerald-500 ring-4 ring-green-100 shadow-sm" :
                        done    ? "bg-green-500" : "bg-gray-100"
                      }`}>
                        <Icon size={15} className={done ? "text-white" : "text-gray-400"} />
                      </div>
                      {idx < TRACKING_STEPS.length - 1 && (
                        <div className={`w-0.5 h-8 mt-0.5 transition-colors ${idx < currentIdx ? "bg-green-400" : "bg-gray-100"}`} />
                      )}
                    </div>
                    <div className="pb-6 pt-1">
                      <p className={`text-sm font-bold ${done ? "text-gray-900" : "text-gray-400"}`}>{step.label}</p>
                      {current && <p className="text-xs text-green-600 mt-0.5">{step.desc}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={`rounded-2xl border p-4 flex items-center gap-3 ${order.status === "rejected" ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
            <XCircle size={20} className={order.status === "rejected" ? "text-red-500 shrink-0" : "text-gray-500 shrink-0"} />
            <div>
              <p className={`text-sm font-bold ${order.status === "rejected" ? "text-red-700" : "text-gray-700"}`}>
                Order {order.status}
              </p>
              {order.rejectionReason && <p className="text-xs text-gray-500 mt-0.5">{order.rejectionReason}</p>}
            </div>
          </div>
        )}

        {/* Rider — out for delivery */}
        {order.status === "out_for_delivery" && rider && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0"><Truck size={20} /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">{rider.name} is on the way</p>
              <p className="text-xs text-gray-400">Your delivery partner</p>
            </div>
            <a href={`tel:${rider.phone}`} className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-3 py-2 rounded-xl shrink-0"><Phone size={14} /> Call</a>
          </div>
        )}

        {/* Actions: Cancel (pending only) + Reorder */}
        <OrderActions
          orderId={order.id}
          orderNumber={order.orderNumber}
          status={order.status}
          items={items.map(i => ({
            id: i.productId ?? 0,
            name: i.productName,
            price: i.price,
            unit: i.productUnit ?? undefined,
            image: i.productImage ?? undefined,
            quantity: i.quantity,
          }))}
        />

        {/* Invoice — only for delivered orders */}
        {order.status === "delivered" && (
          <InvoiceButton
            orderId={order.id}
            orderNumber={order.orderNumber}
            createdAt={new Date(order.createdAt).toISOString()}
            paymentMethod={order.paymentMethod}
            subtotal={order.subtotal}
            deliveryFee={order.deliveryFee}
            discount={order.discount}
            total={order.total}
            couponCode={order.couponCode}
            freeNote={order.freeNote}
            items={items.map(i => ({ name: i.productName, unit: i.productUnit, quantity: i.quantity, price: i.price, total: i.total }))}
            address={addressRows[0] ?? null}
          />
        )}

        {/* Recurring order */}
        <RepeatOrder
          items={items.filter(i => i.productId).map(i => ({ productId: i.productId as number, quantity: i.quantity }))}
          addressId={order.addressId ?? null}
        />

        {/* Return / refund — delivered orders only */}
        {(order.status === "delivered" || existingReturn) && (
          <ReturnRequest
            orderId={order.id}
            windowOpen={canRequestReturn(order)}
            items={items.map(i => ({ name: i.productName, quantity: i.quantity }))}
            existing={existingReturn}
            storePhone={STORE_PHONE}
          />
        )}

        {/* Call store */}
        <a
          href={`tel:+91${STORE_PHONE.replace(/\D/g, "")}`}
          className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-3.5 shadow-sm hover:shadow-md hover:border-green-200 transition-all group"
        >
          <div className="w-10 h-10 bg-linear-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-green-500/30">
            <Phone size={17} className="text-white" fill="white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">Need help with this order?</p>
            <p className="text-xs text-gray-400 mt-0.5">Call us at +91 {STORE_PHONE}</p>
          </div>
          <span className="text-xs font-bold text-green-600 group-hover:underline">Call Now</span>
        </a>

        {/* Items */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h2 className="text-sm font-extrabold text-gray-900 mb-3">Items ({items.length})</h2>
          <div className="space-y-2.5 divide-y divide-gray-50">
            {items.map(item => (
              <div key={item.id} className="flex justify-between items-center text-sm pt-2.5 first:pt-0">
                <div className="flex-1 min-w-0">
                  <span className="text-gray-800 font-medium">{item.productName}</span>
                  {item.productUnit && <span className="text-gray-400 text-xs ml-1">({item.productUnit})</span>}
                  <span className="text-gray-400"> × {item.quantity}</span>
                </div>
                <span className="font-bold text-gray-900 shrink-0 ml-2">{formatPrice(item.total)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Free delivery celebration */}
        {order.deliveryFee === 0 && <FreeDeliveryPopper />}

        {/* Bill */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2.5">
          <h2 className="text-sm font-extrabold text-gray-900">Bill Summary</h2>
          <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span className="font-medium text-gray-900">{formatPrice(order.subtotal)}</span></div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Delivery</span>
            {order.deliveryFee === 0
              ? <span className="text-green-600 font-bold">FREE</span>
              : <span className="font-medium text-gray-900">{formatPrice(order.deliveryFee)}</span>}
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
              <span className="text-green-600 font-bold">−{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="border-t border-gray-100 pt-2.5 flex justify-between font-extrabold text-base">
            <span>Total</span>
            <span className="text-green-600">{formatPrice(order.total)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-400 pt-0.5">
            <span>Payment</span>
            <span className="uppercase font-semibold">{order.paymentMethod}</span>
          </div>
        </div>

        {/* Address */}
        {addressRows[0] && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
                <MapPin size={13} className="text-green-600" />
              </div>
              <h2 className="text-sm font-extrabold text-gray-900">Delivery Address</h2>
            </div>
            <p className="text-sm font-bold text-gray-900">{addressRows[0].name}</p>
            <p className="text-sm text-gray-500 mt-0.5">
              {addressRows[0].line1}{addressRows[0].line2 ? `, ${addressRows[0].line2}` : ""}
            </p>
            <p className="text-sm text-gray-400 mt-0.5">{addressRows[0].city} — {addressRows[0].pincode}</p>
            <p className="text-xs text-gray-400 mt-1">{addressRows[0].phone}</p>
          </div>
        )}
      </div>
    </div>
  );
}
