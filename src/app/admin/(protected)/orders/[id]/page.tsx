import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { orders, orderItems, addresses, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { formatPrice, STATUS_LABELS, STATUS_COLORS, ORDER_STATUSES, type OrderStatus } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ChevronLeft, MapPin, Phone, User, Package } from "lucide-react";
import { AdminOrderActions } from "./admin-order-actions";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [order] = await db.select().from(orders).where(eq(orders.id, Number(id))).limit(1);
  if (!order) notFound();

  const [items, addressRows, customer] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    order.addressId
      ? db.select().from(addresses).where(eq(addresses.id, order.addressId)).limit(1)
      : Promise.resolve([]),
    db.select().from(users).where(eq(users.id, order.userId)).limit(1),
  ]);

  const statusColor = STATUS_COLORS[order.status as OrderStatus];

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/orders"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <ChevronLeft size={18} className="text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-gray-900">Order #{order.orderNumber}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
          </p>
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${statusColor}`}>
          {STATUS_LABELS[order.status as OrderStatus]}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Status Management */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:col-span-2">
          <h2 className="text-sm font-extrabold text-gray-900 mb-4">Update Status</h2>
          <AdminOrderActions
            orderId={order.id}
            currentStatus={order.status}
            orderNumber={order.orderNumber}
          />
        </div>

        {/* Customer */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
              <User size={13} className="text-blue-600" />
            </div>
            <h2 className="text-sm font-extrabold text-gray-900">Customer</h2>
          </div>
          <p className="text-sm font-bold text-gray-900">{customer[0]?.name ?? "—"}</p>
          <p className="text-sm text-gray-500 mt-0.5">{customer[0]?.email ?? "—"}</p>
          {customer[0]?.phone && (
            <a
              href={`tel:+91${customer[0].phone}`}
              className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-green-600 hover:underline"
            >
              <Phone size={11} /> {customer[0].phone}
            </a>
          )}
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
              <MapPin size={13} className="text-green-600" />
            </div>
            <h2 className="text-sm font-extrabold text-gray-900">Delivery Address</h2>
          </div>
          {addressRows[0] ? (
            <>
              <p className="text-sm font-bold text-gray-900">{addressRows[0].name}</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {addressRows[0].line1}{addressRows[0].line2 ? `, ${addressRows[0].line2}` : ""}
              </p>
              <p className="text-sm text-gray-400 mt-0.5">{addressRows[0].city} — {addressRows[0].pincode}</p>
              <p className="text-xs text-gray-400 mt-1">{addressRows[0].phone}</p>
              {order.deliveryLat != null && order.deliveryLng != null && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${order.deliveryLat},${order.deliveryLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2.5 text-xs font-bold text-green-600 hover:underline"
                >
                  <MapPin size={12} /> Navigate to customer&apos;s pinned location
                </a>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400">No address on record</p>
          )}
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center">
              <Package size={13} className="text-orange-600" />
            </div>
            <h2 className="text-sm font-extrabold text-gray-900">Items ({items.length})</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {items.map(item => (
              <div key={item.id} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0 text-sm">
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-800">{item.productName}</span>
                  {item.productUnit && <span className="text-gray-400 text-xs ml-1">({item.productUnit})</span>}
                  <span className="text-gray-400 ml-1">× {item.quantity}</span>
                </div>
                <span className="font-bold text-gray-900 shrink-0 ml-4">{formatPrice(item.total)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bill */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:col-span-2">
          <h2 className="text-sm font-extrabold text-gray-900 mb-3">Bill Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span className="font-medium text-gray-900">{formatPrice(order.subtotal)}</span>
            </div>
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
            {order.couponCode && (
              <div className="flex justify-between text-xs text-gray-400">
                <span>Coupon</span>
                <span className="font-semibold text-green-600">{order.couponCode}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
