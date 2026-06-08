"use client";

import Link from "next/link";
import { useState } from "react";
import { formatPrice, STATUS_LABELS, STATUS_COLORS, type OrderStatus } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ChevronRight, ShoppingBag, Clock } from "lucide-react";
import { LottiePlayer } from "@/components/lottie-player";
import emptyBoxAnim from "@/lottie/empty-box.json";
import deliveryAnim from "@/lottie/delivery.json";
import { cn } from "@/lib/utils";

type Tab = "all" | "active" | "delivered" | "cancelled";

const TABS: { value: Tab; label: string }[] = [
  { value: "all",       label: "All"       },
  { value: "active",    label: "Active"    },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const ACTIVE_STATUSES    = ["pending", "accepted", "packed", "out_for_delivery"];
const CANCELLED_STATUSES = ["rejected", "cancelled"];

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  total: number;
  createdAt: Date | string;
}

export function OrdersClient({ orders }: { orders: Order[] }) {
  const [tab, setTab] = useState<Tab>("all");

  const filtered = orders.filter(o => {
    if (tab === "active")    return ACTIVE_STATUSES.includes(o.status);
    if (tab === "delivered") return o.status === "delivered";
    if (tab === "cancelled") return CANCELLED_STATUSES.includes(o.status);
    return true;
  });

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="w-44 h-44 mb-1">
          <LottiePlayer animationData={emptyBoxAnim} loop className="w-full h-full" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-2">No orders yet</h2>
        <p className="text-gray-500 text-sm mb-6 max-w-xs">Your order history will appear here once you place your first order.</p>
        <Link href="/" className="flex items-center gap-2 bg-linear-to-r from-green-600 to-emerald-600 text-white px-7 py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-green-600/30">
          <ShoppingBag size={16} /> Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-20 glass border-b border-gray-100/80 px-4 pt-3.5 pb-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-extrabold text-gray-900">My Orders</h1>
          <p className="text-xs text-gray-400">{filtered.length} order{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        {/* Filter tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-px">
          {TABS.map(t => {
            const count = t.value === "all" ? orders.length
              : t.value === "active"    ? orders.filter(o => ACTIVE_STATUSES.includes(o.status)).length
              : t.value === "delivered" ? orders.filter(o => o.status === "delivered").length
              : orders.filter(o => CANCELLED_STATUSES.includes(o.status)).length;
            return (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={cn(
                  "flex items-center gap-1.5 shrink-0 px-3.5 h-9 rounded-t-xl text-xs font-semibold transition-all border-b-2",
                  tab === t.value
                    ? "border-green-500 text-green-700 bg-green-50/50"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                {t.label}
                {count > 0 && (
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                    tab === t.value ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="text-4xl mb-3">📭</span>
            <p className="font-semibold text-gray-600">No {tab} orders</p>
          </div>
        ) : (
          filtered.map(order => {
            const isActive = ACTIVE_STATUSES.includes(order.status);
            return (
              <Link key={order.id} href={`/orders/${order.id}`}
                className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.99] transition-all overflow-hidden group">
                <div className={`h-1 w-full ${isActive ? "bg-linear-to-r from-green-500 to-emerald-400" : "bg-gray-100"}`} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {isActive && (
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                          </span>
                        )}
                        <p className="text-xs font-bold text-gray-500 font-mono">#{order.orderNumber}</p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
                        <Clock size={11} />
                        {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status as OrderStatus]}`}>
                      {STATUS_LABELS[order.status as OrderStatus]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-extrabold text-gray-900">{formatPrice(order.total)}</span>
                      <span className="text-xs text-gray-400 uppercase font-semibold">{order.paymentMethod}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-green-600 transition-colors">
                      View <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
