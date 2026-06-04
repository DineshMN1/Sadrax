"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, STATUS_LABELS, STATUS_COLORS, type OrderStatus } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Phone, MessageSquare, Printer, Check, X, Package, Truck, MapPin, RefreshCw, LogOut } from "lucide-react";
import { toast } from "sonner";
import { signOut } from "@/lib/auth-client";
import { PanelSwitcher } from "@/components/panel-switcher";

interface OrderItem {
  id: number;
  productName: string;
  productUnit?: string;
  quantity: number;
  price: number;
  total: number;
}

interface OrderAddress {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city?: string;
  pincode: string;
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  createdAt: string;
  notes?: string;
  items: OrderItem[];
  address?: OrderAddress;
  customerPhone?: string;
}

const ACTION_BUTTONS: Record<string, { next: OrderStatus; label: string; icon: React.ElementType; color: string }[]> = {
  pending: [
    { next: "accepted", label: "Accept", icon: Check, color: "bg-green-600 hover:bg-green-500" },
    { next: "rejected", label: "Reject", icon: X, color: "bg-red-600 hover:bg-red-500" },
  ],
  accepted: [{ next: "packed", label: "Mark Packed", icon: Package, color: "bg-blue-600 hover:bg-blue-500" }],
  packed: [{ next: "out_for_delivery", label: "Out for Delivery", icon: Truck, color: "bg-orange-600 hover:bg-orange-500" }],
  out_for_delivery: [{ next: "delivered", label: "Mark Delivered", icon: Check, color: "bg-green-600 hover:bg-green-500" }],
};

function OrderCard({ order, onUpdate }: { order: Order; onUpdate: (id: number, status: OrderStatus) => void }) {
  const [updating, setUpdating] = useState(false);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const actions = ACTION_BUTTONS[order.status] ?? [];

  const handleAction = async (next: OrderStatus) => {
    if (next === "rejected") { setShowRejectReason(true); return; }
    setUpdating(true);
    try {
      const res = await fetch(`/api/cord/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) onUpdate(order.id, next);
      else toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/cord/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", reason: rejectReason }),
      });
      if (res.ok) { onUpdate(order.id, "rejected"); setShowRejectReason(false); }
      else toast.error("Failed to reject");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div>
          <span className="text-xs font-bold text-gray-400">#{order.orderNumber}</span>
          <p className="text-xs text-gray-500 mt-0.5">{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status as OrderStatus]}`}>
            {STATUS_LABELS[order.status as OrderStatus]}
          </span>
          <span className="text-xs text-gray-400 uppercase">{order.paymentMethod}</span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Customer + Address */}
        {order.address && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin size={14} className="text-gray-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-white">{order.address.name}</p>
              <p className="text-gray-400 text-xs">{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ""}</p>
              <p className="text-gray-400 text-xs">{order.address.pincode}</p>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="space-y-1">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-300">{item.productName} {item.productUnit ? `(${item.productUnit})` : ""} × {item.quantity}</span>
              <span className="text-gray-400">{formatPrice(item.total)}</span>
            </div>
          ))}
        </div>

        {order.notes && (
          <p className="text-xs text-yellow-400 bg-yellow-400/10 rounded-lg px-3 py-2">Note: {order.notes}</p>
        )}

        {/* Total */}
        <div className="flex justify-between font-bold border-t border-gray-800 pt-2">
          <span className="text-white">Total</span>
          <span className="text-green-400">{formatPrice(order.total)}</span>
        </div>

        {/* Contact buttons */}
        {order.customerPhone && (
          <div className="flex gap-2">
            <a
              href={`tel:${order.customerPhone}`}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-gray-800 hover:bg-gray-700 rounded-xl text-xs font-semibold text-gray-300 transition-colors"
            >
              <Phone size={13} /> Call
            </a>
            <a
              href={`https://wa.me/91${order.customerPhone.replace(/^\+91/, "")}?text=Hi! Your Sadrax order %23${order.orderNumber}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-green-900 hover:bg-green-800 rounded-xl text-xs font-semibold text-green-300 transition-colors"
            >
              <MessageSquare size={13} /> WhatsApp
            </a>
            <button
              onClick={() => window.print()}
              className="w-9 h-9 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-400 transition-colors"
            >
              <Printer size={14} />
            </button>
          </div>
        )}

        {/* Action buttons */}
        {showRejectReason ? (
          <div className="space-y-2">
            <input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              className="w-full h-9 px-3 bg-gray-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowRejectReason(false)} className="flex-1 h-9 bg-gray-800 rounded-xl text-sm text-gray-400">Cancel</button>
              <button onClick={handleReject} disabled={updating} className="flex-1 h-9 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-semibold text-white">Reject</button>
            </div>
          </div>
        ) : actions.length > 0 ? (
          <div className="flex gap-2">
            {actions.map(({ next, label, icon: Icon, color }) => (
              <button
                key={next}
                onClick={() => handleAction(next)}
                disabled={updating}
                className={`flex-1 flex items-center justify-center gap-1.5 h-9 ${color} rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function CordPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<"active" | "all">("active");
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastOrderCount = useRef(0);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/cord/orders?filter=${filter}`);
      const data = await res.json();
      const incoming = data.orders as Order[];

      // Play alert sound for new pending orders
      const pendingCount = incoming.filter((o) => o.status === "pending").length;
      if (pendingCount > lastOrderCount.current && lastOrderCount.current >= 0) {
        audioRef.current?.play().catch(() => {});
        toast.success(`${pendingCount} new order${pendingCount > 1 ? "s" : ""}!`, { duration: 5000 });
      }
      lastOrderCount.current = pendingCount;
      // Update browser tab title
      document.title = pendingCount > 0 ? `(${pendingCount}) Cord — Sadrax` : "Cord — Sadrax";
      setOrders(incoming);
    } catch {
      // silently fail on background polls
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000); // poll every 8s
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleStatusUpdate = (id: number, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const activeOrders = orders.filter((o) => !["delivered", "rejected", "cancelled"].includes(o.status));
  const displayOrders = filter === "active" ? activeOrders : orders;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hidden audio for new order alert */}
      <audio ref={audioRef} src="/sounds/new-order.mp3" preload="auto" />

      {/* Header */}
      <div className="sticky top-0 z-20 bg-gray-950 border-b border-gray-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                Cord
                {activeOrders.filter(o => o.status === "pending").length > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] font-extrabold rounded-full animate-pulse">
                    {activeOrders.filter(o => o.status === "pending").length}
                  </span>
                )}
              </h1>
              <p className="text-xs text-gray-500">
                {activeOrders.length} active order{activeOrders.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PanelSwitcher current="cord" dark />
            <button
              onClick={fetchOrders}
              className="w-9 h-9 flex items-center justify-center bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={async () => { await signOut(); router.replace("/cord/login"); }}
              className="w-9 h-9 flex items-center justify-center bg-gray-800 rounded-xl text-gray-400 hover:text-red-400 transition-colors"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
            <div className="flex bg-gray-800 rounded-xl p-0.5">
              <button
                onClick={() => setFilter("active")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === "active" ? "bg-white text-gray-900" : "text-gray-400"}`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === "all" ? "bg-white text-gray-900" : "text-gray-400"}`}
              >
                All
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <span className="text-5xl mb-4">✅</span>
            <h3 className="font-semibold text-gray-300">All clear!</h3>
            <p className="text-sm text-gray-600 mt-1">No active orders right now</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayOrders.map((order) => (
              <OrderCard key={order.id} order={order} onUpdate={handleStatusUpdate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
