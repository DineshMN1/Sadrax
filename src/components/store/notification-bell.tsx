"use client";

import { useState, useEffect } from "react";
import { Bell, Package, X, CheckCircle2 } from "lucide-react";
import { useNotifications, type AppNotification } from "@/store/notifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function NotificationBell() {
  const { items, unread, markAllRead, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const count = unread();

  // Notifications are registered by OrderStatusWatcher when the user visits
  // an order detail page — no polling needed here.

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(v => !v); if (!open && count > 0) markAllRead(); }}
        className="relative w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        <Bell size={17} className="text-gray-600" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center shadow-sm animate-bounce-in">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-11 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <p className="text-sm font-extrabold text-gray-900">Notifications</p>
              <button onClick={() => setOpen(false)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                <X size={14} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                  <Bell size={22} className="text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-500">No notifications yet</p>
                <p className="text-xs text-gray-400 mt-1">Order updates will appear here</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                {items.map(n => (
                  <NotificationItem key={n.id} n={n} onRead={markRead} onClose={() => setOpen(false)} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function NotificationItem({ n, onRead, onClose }: { n: AppNotification; onRead: (id: string) => void; onClose: () => void }) {
  return (
    <Link
      href={`/orders/${n.orderId}`}
      onClick={() => { onRead(n.id); onClose(); }}
      className={cn("flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors", !n.read && "bg-green-50/50")}
    >
      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5", n.read ? "bg-gray-100" : "bg-green-100")}>
        <Package size={14} className={n.read ? "text-gray-400" : "text-green-600"} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-900">Order #{n.orderNumber}</p>
        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.message}</p>
        <p className="text-[10px] text-gray-400 mt-1">{formatDistanceToNow(n.createdAt, { addSuffix: true })}</p>
      </div>
      {!n.read && <span className="w-2 h-2 bg-green-500 rounded-full shrink-0 mt-2" />}
    </Link>
  );
}

/* Drop this on any order page to auto-register status-change notifications */
export function OrderStatusWatcher({
  orderId,
  orderNumber,
  status,
}: {
  orderId: number;
  orderNumber: string;
  status: string;
}) {
  const add = useNotifications(s => s.add);

  useEffect(() => {
    const key = `sadrax_ord_status_${orderId}`;
    const prev = localStorage.getItem(key);
    if (prev && prev !== status) {
      const messages: Record<string, string> = {
        accepted:         "Your order has been accepted and is being prepared.",
        packed:           "Your order is packed and ready for pickup.",
        out_for_delivery: "Your order is out for delivery! 🛵",
        delivered:        "Your order has been delivered. Enjoy! 🎉",
        rejected:         "Your order could not be processed.",
        cancelled:        "Your order has been cancelled.",
      };
      if (messages[status]) {
        add({ orderId, orderNumber, message: messages[status] });
      }
    }
    localStorage.setItem(key, status);
  }, [orderId, orderNumber, status, add]);

  return null;
}
