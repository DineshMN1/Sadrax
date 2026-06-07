"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, STATUS_LABELS, STATUS_COLORS, type OrderStatus } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Phone, MessageSquare, Printer, Check, X, Package, Truck, MapPin, RefreshCw, LogOut, Zap, Navigation, Eye, EyeOff, Send } from "lucide-react";
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
  tip?: number;
  deliveryInstructions?: string | null;
  deliverySlot?: string | null;
  deliveryPersonId?: number | null;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  items: OrderItem[];
  address?: OrderAddress;
  customerPhone?: string;
}

interface Rider { id: number; name: string; phone: string; active: boolean }

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
const rupee = (paise: number) => "₹" + (paise / 100).toFixed(2);

// Print a clean single-order bill (not the whole page) in a popup window.
function printBill(order: Order) {
  const w = window.open("", "_blank", "width=380,height=640");
  if (!w) { toast.error("Allow pop-ups to print the bill"); return; }

  const date = new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  const itemRows = order.items.map((i) => `
    <tr>
      <td>${escapeHtml(i.productName)}${i.productUnit ? ` <span class="u">(${escapeHtml(i.productUnit)})</span>` : ""}
        <br><span class="u">${rupee(i.price)} × ${i.quantity}</span></td>
      <td class="r">${rupee(i.total)}</td>
    </tr>`).join("");

  const addr = order.address ? `
    <hr>
    <div class="sec">
      <strong>${escapeHtml(order.address.name)}</strong><br>
      ${order.address.phone ? escapeHtml(order.address.phone) + "<br>" : ""}
      ${escapeHtml(order.address.line1)}${order.address.line2 ? ", " + escapeHtml(order.address.line2) : ""}<br>
      ${order.address.city ? escapeHtml(order.address.city) + " — " : ""}${escapeHtml(order.address.pincode)}
    </div>` : "";

  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Bill #${order.orderNumber}</title>
  <style>
    *{font-family:-apple-system,system-ui,Segoe UI,Roboto,sans-serif;box-sizing:border-box}
    body{width:280px;margin:0 auto;padding:14px;color:#111;font-size:12px}
    h1{font-size:17px;text-align:center;margin:0}
    .muted{color:#777}.center{text-align:center}.u{color:#999;font-size:11px}
    hr{border:none;border-top:1px dashed #bbb;margin:8px 0}
    table{width:100%;border-collapse:collapse}
    td{padding:3px 0;vertical-align:top}.r{text-align:right;white-space:nowrap}
    .sec{margin:6px 0;line-height:1.5}
    .row{display:flex;justify-content:space-between;margin:2px 0}
    .tot{font-weight:700;font-size:15px}
    @media print{body{width:auto}}
  </style></head><body>
    <h1>Sadrax Grocery</h1>
    <p class="center muted" style="margin:2px 0 8px">Bill / Receipt</p>
    <hr>
    <div class="row"><span class="muted">Order</span><strong>#${order.orderNumber}</strong></div>
    <div class="row"><span class="muted">Date</span><span>${date}</span></div>
    <div class="row"><span class="muted">Status</span><span>${escapeHtml(STATUS_LABELS[order.status as OrderStatus] ?? order.status)}</span></div>
    <div class="row"><span class="muted">Payment</span><span>${order.paymentMethod.toUpperCase()}</span></div>
    ${addr}
    <hr>
    <table>${itemRows}</table>
    <hr>
    <div class="row"><span class="muted">Subtotal</span><span>${rupee(order.subtotal)}</span></div>
    <div class="row"><span class="muted">Delivery</span><span>${order.deliveryFee === 0 ? "FREE" : rupee(order.deliveryFee)}</span></div>
    ${order.discount > 0 ? `<div class="row"><span class="muted">Discount</span><span>-${rupee(order.discount)}</span></div>` : ""}
    <hr>
    <div class="row tot"><span>Total</span><span>${rupee(order.total)}</span></div>
    <hr>
    <p class="center muted">Thank you for shopping with us!</p>
  </body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 300);
}

const ACTION_BUTTONS: Record<string, { next: OrderStatus; label: string; icon: React.ElementType; color: string }[]> = {
  pending: [
    { next: "accepted",  label: "Accept", icon: Check, color: "bg-green-600 hover:bg-green-500" },
    { next: "rejected",  label: "Reject", icon: X,     color: "bg-red-500 hover:bg-red-400"   },
  ],
  accepted:         [{ next: "packed",           label: "Mark Packed",       icon: Package, color: "bg-blue-600 hover:bg-blue-500"   }],
  packed:           [{ next: "out_for_delivery", label: "Out for Delivery",  icon: Truck,   color: "bg-orange-500 hover:bg-orange-400"}],
  out_for_delivery: [{ next: "delivered",        label: "Mark Delivered",    icon: Check,   color: "bg-green-600 hover:bg-green-500"  }],
};

function OrderCard({ order, onUpdate, riders }: { order: Order; onUpdate: (id: number, status: OrderStatus) => void; riders: Rider[] }) {
  const [updating, setUpdating]         = useState(false);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [expanded, setExpanded]         = useState(false);
  const [tgSending, setTgSending]       = useState(false);
  const [riderId, setRiderId]           = useState<string>(order.deliveryPersonId ? String(order.deliveryPersonId) : "");
  const [sharing, setSharing]           = useState(false);
  const watchRef                        = useRef<number | null>(null);

  // Directions: route to the customer's pinned GPS spot when we have it, else the typed address.
  const hasPinned = order.deliveryLat != null && order.deliveryLng != null;
  const [destMode, setDestMode]         = useState<"pinned" | "address">(hasPinned ? "pinned" : "address");

  const assignRider = async (val: string) => {
    setRiderId(val);
    await fetch(`/api/cord/orders/${order.id}/assign`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deliveryPersonId: val ? Number(val) : null }),
    });
    toast.success(val ? "Rider assigned" : "Rider cleared");
  };

  const toggleShareLocation = () => {
    if (sharing) {
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
      setSharing(false);
      return;
    }
    if (!navigator.geolocation) { toast.error("Location not supported"); return; }
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        fetch("/api/cord/rider-location", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id, lat: pos.coords.latitude, lng: pos.coords.longitude }),
        }).catch(() => {});
      },
      () => toast.error("Couldn't get location"),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    setSharing(true);
    toast.success("Sharing live location with the customer");
  };

  useEffect(() => () => { if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current); }, []);

  const actions   = ACTION_BUTTONS[order.status] ?? [];
  const isPending = order.status === "pending";

  const handleTelegramNotify = async () => {
    setTgSending(true);
    try {
      await fetch("/api/cord/notify-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      toast.success("Notified via Telegram");
    } catch {
      toast.error("Telegram notification failed");
    } finally {
      setTgSending(false);
    }
  };

  // Opens Google Maps directions FROM the rider's current location (origin
  // omitted = device location) TO either the pinned GPS spot or the address.
  const openDirections = () => {
    let destination = "";
    if (destMode === "pinned" && hasPinned) {
      destination = `${order.deliveryLat},${order.deliveryLng}`;
    } else if (order.address) {
      destination = encodeURIComponent(
        `${order.address.line1}${order.address.line2 ? " " + order.address.line2 : ""}, ${order.address.pincode}`
      );
    }
    if (!destination) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`, "_blank");
  };

  // Rich WhatsApp message with the order summary + a thank-you.
  const whatsappHref = () => {
    const phone = (order.customerPhone ?? "").replace(/^\+91/, "").replace(/\D/g, "");
    const itemLines = order.items.map(i => `• ${i.productName}${i.productUnit ? ` (${i.productUnit})` : ""} × ${i.quantity}`).join("\n");
    const rupee = (p: number) => `₹${(p / 100).toFixed(0)}`;
    const msg =
`Hi ${order.address?.name ?? "there"}! 🙏

Thank you for ordering from *Sadrax* — by Malik Stores!

🧾 *Order #${order.orderNumber}*
${itemLines}

Subtotal: ${rupee(order.subtotal)}
Delivery: ${order.deliveryFee === 0 ? "FREE" : rupee(order.deliveryFee)}${order.discount > 0 ? `\nDiscount: -${rupee(order.discount)}` : ""}
*Total: ${rupee(order.total)}* (${order.paymentMethod.toUpperCase()})

Your order is being prepared and will reach you soon. We truly appreciate your support! 💚
— Team Sadrax`;
    return `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`;
  };

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
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
      isPending ? "border-orange-200 shadow-orange-100 ring-1 ring-orange-200" : "border-gray-100"
    }`}>
      {/* Card Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${
        isPending ? "bg-orange-50 border-orange-100" : "bg-gray-50 border-gray-100"
      }`}>
        <div>
          <span className="text-sm font-extrabold text-gray-900">#{order.orderNumber}</span>
          <p className="text-xs text-gray-400 mt-0.5">{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status as OrderStatus]}`}>
            {STATUS_LABELS[order.status as OrderStatus]}
          </span>
          <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded-lg">{order.paymentMethod}</span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Address */}
        {order.address && (
          <div className="flex items-start gap-2">
            <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{order.address.name}</p>
              <p className="text-xs text-gray-500">{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ""}</p>
              <p className="text-xs text-gray-400">{order.address.pincode}</p>
            </div>
          </div>
        )}

        {/* Items compact summary */}
        <p className="text-xs text-gray-500">
          {order.items.length} item{order.items.length !== 1 ? "s" : ""} —{" "}
          {order.items.slice(0, 2).map(i => `${i.productName} ×${i.quantity}`).join(", ")}
          {order.items.length > 2 ? ` +${order.items.length - 2} more` : ""}
        </p>

        {/* Notes */}
        {order.notes && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            📝 {order.notes}
          </p>
        )}

        {/* Delivery instructions (customer) */}
        {order.deliveryInstructions && (
          <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
            🛵 {order.deliveryInstructions}
          </p>
        )}

        {/* Slot + tip */}
        {(order.deliverySlot || (order.tip ?? 0) > 0) && (
          <div className="flex flex-wrap gap-2">
            {order.deliverySlot && (
              <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">🕒 {order.deliverySlot}</span>
            )}
            {(order.tip ?? 0) > 0 && (
              <span className="text-[11px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded-lg">💚 Tip {formatPrice(order.tip!)}</span>
            )}
          </div>
        )}

        {/* Total */}
        <div className="flex justify-between font-extrabold text-base border-t border-gray-100 pt-2.5">
          <span className="text-gray-900">Total</span>
          <span className="text-green-600">{formatPrice(order.total)}</span>
        </div>

        {/* View / Direction / Telegram / Contact buttons */}
        <div className="flex gap-2 flex-wrap">
          {/* View items toggle */}
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1.5 h-9 px-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-semibold text-gray-700 transition-colors"
          >
            {expanded ? <EyeOff size={13} /> : <Eye size={13} />}
            {expanded ? "Hide" : "View"}
          </button>

          {/* Direction button (routes from rider's current location) */}
          {(order.address || hasPinned) && (
            <div className="flex items-center rounded-xl bg-blue-50 overflow-hidden">
              <button
                onClick={openDirections}
                className="flex items-center gap-1.5 h-9 px-3 hover:bg-blue-100 text-xs font-semibold text-blue-700 transition-colors"
              >
                <Navigation size={13} /> Direction
              </button>
              {/* Switch destination: pinned GPS ↔ address (only when a pin exists) */}
              {hasPinned && order.address && (
                <button
                  onClick={() => setDestMode(m => (m === "pinned" ? "address" : "pinned"))}
                  title="Switch destination"
                  className="h-9 px-2.5 border-l border-blue-100 text-[11px] font-bold text-blue-600 hover:bg-blue-100 transition-colors"
                >
                  {destMode === "pinned" ? "📍 Live pin" : "🏠 Address"}
                </button>
              )}
            </div>
          )}

          {/* Telegram notify */}
          <button
            onClick={handleTelegramNotify}
            disabled={tgSending}
            className="flex items-center gap-1.5 h-9 px-3 bg-sky-50 hover:bg-sky-100 rounded-xl text-xs font-semibold text-sky-700 transition-colors disabled:opacity-50"
          >
            <Send size={13} /> {tgSending ? "…" : "Telegram"}
          </button>

          {/* Call customer */}
          {order.customerPhone && (
            <a
              href={`tel:${order.customerPhone}`}
              className="flex items-center justify-center gap-1.5 h-9 px-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-semibold text-gray-700 transition-colors"
            >
              <Phone size={13} /> Call
            </a>
          )}

          {/* WhatsApp */}
          {order.customerPhone && (
            <a
              href={whatsappHref()}
              target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-1.5 h-9 px-3 bg-green-50 hover:bg-green-100 rounded-xl text-xs font-semibold text-green-700 transition-colors"
            >
              <MessageSquare size={13} /> WhatsApp
            </a>
          )}

          <button
            onClick={() => printBill(order)}
            title="Print bill"
            className="flex items-center gap-1.5 h-9 px-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-semibold text-gray-700 transition-colors"
          >
            <Printer size={13} /> Print
          </button>
        </div>

        {/* Expanded items view */}
        {expanded && (
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 space-y-1.5 animate-slide-up">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Order Items</p>
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.productName}
                  {item.productUnit && <span className="text-gray-400 text-xs ml-1">({item.productUnit})</span>}
                  <span className="text-gray-400 ml-1">× {item.quantity}</span>
                </span>
                <span className="font-semibold text-gray-800">{formatPrice(item.total)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Rider assignment + live location (active orders) */}
        {!["delivered", "rejected", "cancelled"].includes(order.status) && (
          <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
            <select value={riderId} onChange={(e) => assignRider(e.target.value)}
              className="h-9 px-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none">
              <option value="">Assign rider…</option>
              {riders.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            {order.status === "out_for_delivery" && (
              <button onClick={toggleShareLocation}
                className={`flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold transition-colors ${sharing ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700 hover:bg-green-100"}`}>
                <Navigation size={13} /> {sharing ? "Stop sharing" : "Share live location"}
              </button>
            )}
          </div>
        )}

        {/* Action buttons */}
        {showRejectReason ? (
          <div className="space-y-2">
            <input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowRejectReason(false)} className="flex-1 h-9 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm text-gray-600 font-medium transition-colors">Cancel</button>
              <button onClick={handleReject} disabled={updating} className="flex-1 h-9 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50">Reject</button>
            </div>
          </div>
        ) : actions.length > 0 ? (
          <div className="flex gap-2">
            {actions.map(({ next, label, icon: Icon, color }) => (
              <button
                key={next}
                onClick={() => handleAction(next)}
                disabled={updating}
                className={`flex-1 flex items-center justify-center gap-1.5 h-10 ${color} rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50`}
              >
                {updating ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Icon size={14} /> {label}</>
                )}
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
  const [orders, setOrders]   = useState<Order[]>([]);
  const [riders, setRiders]   = useState<Rider[]>([]);
  const [filter, setFilter]   = useState<"active" | "all">("active");
  const [loading, setLoading] = useState(true);
  const audioRef              = useRef<HTMLAudioElement | null>(null);
  const lastOrderCount        = useRef(0);

  useEffect(() => {
    fetch("/api/admin/riders").then((r) => r.json()).then((d) => setRiders((d.riders ?? []).filter((x: Rider) => x.active))).catch(() => {});
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res  = await fetch(`/api/cord/orders?filter=${filter}`);
      const data = await res.json();
      const incoming = data.orders as Order[];

      const pendingCount = incoming.filter((o) => o.status === "pending").length;
      if (pendingCount > lastOrderCount.current && lastOrderCount.current >= 0) {
        audioRef.current?.play().catch(() => {});
        toast.success(`${pendingCount} new order${pendingCount > 1 ? "s" : ""}!`, { duration: 5000 });
      }
      lastOrderCount.current = pendingCount;
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
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleStatusUpdate = (id: number, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const activeOrders  = orders.filter((o) => !["delivered", "rejected", "cancelled"].includes(o.status));
  const displayOrders = filter === "active" ? activeOrders : orders;
  const pendingCount  = activeOrders.filter(o => o.status === "pending").length;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <audio ref={audioRef} src="/sounds/new-order.mp3" preload="auto" />

      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm px-3 py-2.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          {/* Brand */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 shrink-0 bg-linear-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm shadow-orange-500/30">
              <Zap size={16} className="text-white" fill="white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5 leading-none">
                Cord
                {pendingCount > 0 && (
                  <span className="inline-flex items-center justify-center w-4 h-4 bg-red-500 text-white text-[9px] font-extrabold rounded-full animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </h1>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {activeOrders.length} active
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <PanelSwitcher current="cord" />

            {/* Filter toggle */}
            <div className="flex bg-gray-100 rounded-xl p-0.5">
              <button
                onClick={() => setFilter("active")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filter === "active" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter("all")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filter === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
              >
                All
              </button>
            </div>

            <button
              onClick={fetchOrders}
              className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-500 hover:text-gray-800 transition-colors"
            >
              <RefreshCw size={15} />
            </button>

            <button
              onClick={async () => { await signOut(); router.replace("/cord/login"); }}
              className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-red-50 rounded-xl text-gray-500 hover:text-red-500 transition-colors"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-2xl mx-auto w-full px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
              <Check size={28} className="text-green-500" />
            </div>
            <h3 className="font-bold text-gray-800">All clear!</h3>
            <p className="text-sm text-gray-400 mt-1">No active orders right now</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayOrders.map((order) => (
              <OrderCard key={order.id} order={order} onUpdate={handleStatusUpdate} riders={riders} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
