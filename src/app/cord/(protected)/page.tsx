"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, STATUS_LABELS, type OrderStatus } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  Phone, MessageSquare, Printer, Check, X, Package, Truck, MapPin,
  RefreshCw, LogOut, Zap, Navigation, Eye, EyeOff, Send, Gift,
  Pencil, MoreHorizontal, Clock, ShoppingBag, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { signOut } from "@/lib/auth-client";
import { PanelSwitcher } from "@/components/panel-switcher";
import { invoiceNumber } from "@/lib/invoice";
import { OrderEditSheet } from "./order-edit-sheet";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

// ─── Status colours (cord-specific, richer palette) ────────────────────────
const CORD_STATUS_COLORS: Record<string, string> = {
  pending:          "bg-orange-100  text-orange-700",
  accepted:         "bg-blue-100    text-blue-700",
  packed:           "bg-violet-100  text-violet-700",
  out_for_delivery: "bg-emerald-100 text-emerald-700",
  delivered:        "bg-green-100   text-green-700",
  rejected:         "bg-red-100     text-red-700",
  cancelled:        "bg-gray-100    text-gray-500",
};

const STATUS_ACCENT: Record<string, string> = {
  pending:          "bg-orange-500",
  accepted:         "bg-blue-500",
  packed:           "bg-violet-500",
  out_for_delivery: "bg-emerald-500",
  delivered:        "bg-green-500",
  rejected:         "bg-red-500",
  cancelled:        "bg-gray-300",
};

const STATUS_CARD_HEADER: Record<string, string> = {
  pending:          "bg-orange-50  border-b border-orange-100",
  accepted:         "bg-blue-50    border-b border-blue-100",
  packed:           "bg-violet-50  border-b border-violet-100",
  out_for_delivery: "bg-emerald-50 border-b border-emerald-100",
  delivered:        "bg-gray-50    border-b border-gray-100",
  rejected:         "bg-gray-50    border-b border-gray-100",
  cancelled:        "bg-gray-50    border-b border-gray-100",
};

// ─── Types ──────────────────────────────────────────────────────────────────
interface OrderItem {
  id: number; productId: number | null; productName: string;
  productUnit?: string; productImage?: string | null;
  quantity: number; price: number; total: number;
}
interface OrderAddress {
  name: string; phone: string; line1: string;
  line2?: string; city?: string; pincode: string;
}
interface Order {
  id: number; orderNumber: string; status: string; paymentMethod: string;
  total: number; subtotal: number; deliveryFee: number; discount: number;
  createdAt: string; notes?: string; freeNote?: string | null; edited?: boolean;
  tip?: number; deliveryInstructions?: string | null; deliverySlot?: string | null;
  deliveryPersonId?: number | null; deliveryLat?: number | null; deliveryLng?: number | null;
  items: OrderItem[]; address?: OrderAddress; customerPhone?: string;
}
interface Rider { id: number; name: string; phone: string; active: boolean }

// ─── Helpers ────────────────────────────────────────────────────────────────
function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));
}
const rupee = (p: number) => "₹" + (p / 100).toFixed(2);

function orderAgeMinutes(createdAt: string) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000);
}

function AgeTag({ createdAt, status }: { createdAt: string; status: string }) {
  const [mins, setMins] = useState(() => orderAgeMinutes(createdAt));
  useEffect(() => {
    const id = setInterval(() => setMins(orderAgeMinutes(createdAt)), 30_000);
    return () => clearInterval(id);
  }, [createdAt]);
  if (!["pending","accepted","packed"].includes(status)) return null;
  const color = status === "pending"
    ? mins >= 7 ? "text-red-600 bg-red-50 ring-1 ring-red-200"
    : mins >= 3 ? "text-amber-600 bg-amber-50"
    : "text-gray-400 bg-gray-100"
    : "text-gray-400 bg-gray-100";
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${color}`}>
      <Clock size={8} />{mins}m
    </span>
  );
}

// Section header for the grouped "ready panel" layout
function SectionHeader({ label, count, dot, pulse }: { label: string; count: number; dot: string; pulse?: boolean }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <span className={`w-2 h-2 rounded-full shrink-0 ${dot} ${pulse ? "animate-pulse" : ""}`} />
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
      <span className="text-[11px] font-bold bg-gray-900 text-white px-2 py-0.5 rounded-full">{count}</span>
    </div>
  );
}

// ─── Print bill ─────────────────────────────────────────────────────────────
function printBill(order: Order) {
  const w = window.open("", "_blank", "width=380,height=640");
  if (!w) { toast.error("Allow pop-ups to print the bill"); return; }
  const date = new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const itemRows = order.items.map(i => `
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
    <div class="row"><span class="muted">Invoice</span><strong>${invoiceNumber(order.id)}</strong></div>
    <div class="row"><span class="muted">Order</span><span>#${order.orderNumber}</span></div>
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

// ─── Action config ───────────────────────────────────────────────────────────
const ACTION_BUTTONS: Record<string, { next: OrderStatus; label: string; icon: React.ElementType; color: string }[]> = {
  pending:          [
    { next: "accepted",        label: "Accept",           icon: Check,  color: "bg-emerald-600 hover:bg-emerald-500" },
    { next: "rejected",        label: "Reject",           icon: X,      color: "bg-red-600 hover:bg-red-500"        },
  ],
  accepted:         [{ next: "packed",          label: "Mark Packed",      icon: Package, color: "bg-indigo-600 hover:bg-indigo-500"  }],
  packed:           [{ next: "out_for_delivery",label: "Out for Delivery", icon: Truck,   color: "bg-violet-600 hover:bg-violet-500"  }],
  out_for_delivery: [{ next: "delivered",       label: "Mark Delivered",   icon: Check,   color: "bg-emerald-600 hover:bg-emerald-500"}],
};

// ─── Order Card ──────────────────────────────────────────────────────────────
function OrderCard({ order, onUpdate, onRefresh, riders }: {
  order: Order; onUpdate: (id: number, status: OrderStatus) => void;
  onRefresh: () => void; riders: Rider[];
}) {
  const [updating, setUpdating]               = useState(false);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason]       = useState("");
  const [expanded, setExpanded]               = useState(false);
  const [tgSending, setTgSending]             = useState(false);
  const [riderId, setRiderId]                 = useState<string>(order.deliveryPersonId ? String(order.deliveryPersonId) : "");
  const [sharing, setSharing]                 = useState(false);
  const watchRef                              = useRef<number | null>(null);
  const [showEdit, setShowEdit]               = useState(false);
  const editable = ["pending","accepted","packed"].includes(order.status);
  const [showMore, setShowMore]               = useState(false);
  const [showFree, setShowFree]               = useState(false);
  const [freeInput, setFreeInput]             = useState("");
  const [freeing, setFreeing]                 = useState(false);
  const [freedNote, setFreedNote]             = useState<string | null>(order.freeNote ?? null);
  const isFree = freedNote != null || order.total === 0;

  const makeFree = async () => {
    setFreeing(true);
    try {
      const res = await fetch(`/api/cord/orders/${order.id}/free`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: freeInput.trim() }),
      });
      if (res.ok) {
        const d = await res.json();
        setFreedNote(d.order?.freeNote ?? freeInput.trim() ?? "Your order is on us");
        setShowFree(false);
        toast.success("Order marked FREE");
      } else toast.error("Couldn't mark free");
    } finally { setFreeing(false); }
  };

  const hasPinned = order.deliveryLat != null && order.deliveryLng != null;
  const [destMode, setDestMode] = useState<"pinned" | "address">(hasPinned ? "pinned" : "address");

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
      watchRef.current = null; setSharing(false); return;
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
    toast.success("Sharing live location");
  };
  useEffect(() => () => { if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current); }, []);

  const actions   = ACTION_BUTTONS[order.status] ?? [];
  const isPending = order.status === "pending";

  const handleTelegramNotify = async () => {
    setTgSending(true);
    try {
      await fetch("/api/cord/notify-telegram", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      toast.success("Notified via Telegram");
    } catch { toast.error("Telegram failed"); }
    finally { setTgSending(false); }
  };

  const openDirections = () => {
    let dest = "";
    if (destMode === "pinned" && hasPinned) dest = `${order.deliveryLat},${order.deliveryLng}`;
    else if (order.address) dest = encodeURIComponent(`${order.address.line1}${order.address.line2 ? " " + order.address.line2 : ""}, ${order.address.pincode}`);
    if (!dest) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`, "_blank");
  };

  const whatsappHref = () => {
    const phone = (order.customerPhone ?? "").replace(/\D/g, "").slice(-10);
    const itemLines = order.items.map(i => `• ${i.productName}${i.productUnit ? ` (${i.productUnit})` : ""} × ${i.quantity}`).join("\n");
    const r = (p: number) => `₹${(p / 100).toFixed(0)}`;
    const msg =
`Hi ${order.address?.name ?? "there"}! \u{1F64F}

Thank you for ordering from *Sadrax* — by Malik Stores!

\u{1F9FE} *Order #${order.orderNumber}*
${itemLines}

Subtotal: ${r(order.subtotal)}
Delivery: ${order.deliveryFee === 0 ? "FREE" : r(order.deliveryFee)}${order.discount > 0 ? `\nDiscount: -${r(order.discount)}` : ""}
*Total: ${r(order.total)}* (${order.paymentMethod.toUpperCase()})

Your order is being prepared and will reach you soon. \u{1F49A}

\u{1F9FE} Invoice: ${APP_URL}/orders/${order.id}/invoice
— Team Sadrax`;
    return `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`;
  };

  const handleAction = async (next: OrderStatus) => {
    if (next === "rejected") { setShowRejectReason(true); return; }
    setUpdating(true);
    try {
      const res = await fetch(`/api/cord/orders/${order.id}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) onUpdate(order.id, next);
      else toast.error("Failed to update status");
    } finally { setUpdating(false); }
  };

  const handleReject = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/cord/orders/${order.id}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", reason: rejectReason }),
      });
      if (res.ok) { onUpdate(order.id, "rejected"); setShowRejectReason(false); }
      else toast.error("Failed to reject");
    } finally { setUpdating(false); }
  };

  const accent = STATUS_ACCENT[order.status] ?? "bg-gray-300";
  const hdrBg  = STATUS_CARD_HEADER[order.status] ?? "bg-gray-50 border-b border-gray-100";

  return (
    <div className={`bg-white rounded-2xl overflow-hidden transition-all ${
      isPending
        ? "shadow-lg shadow-orange-100/50 ring-1 ring-orange-200 border border-orange-200"
        : "shadow-sm border border-gray-100"
    }`}>
      {/* Coloured top accent strip */}
      <div className={`h-0.75 ${accent}`} />

      {/* Card header */}
      <div className={`flex items-center justify-between px-4 py-3 ${hdrBg}`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-extrabold text-gray-900 tracking-tight">#{order.orderNumber}</span>
          <AgeTag createdAt={order.createdAt} status={order.status} />
          {order.edited && (
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">EDITED</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${CORD_STATUS_COLORS[order.status] ?? ""}`}>
            {STATUS_LABELS[order.status as OrderStatus]}
          </span>
          <span className="text-[10px] font-bold text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-lg">
            {order.paymentMethod.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Customer */}
        {order.address && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-200 flex items-center justify-center shrink-0 text-sm font-extrabold text-gray-600">
              {order.address.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-gray-900 leading-tight">{order.address.name}</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ""}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <MapPin size={10} className="text-gray-400 shrink-0" />
                <span className="text-xs text-gray-400">{order.address.pincode}</span>
              </div>
            </div>
          </div>
        )}

        {/* Items summary */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
          <ShoppingBag size={12} className="text-gray-400 shrink-0" />
          <p className="text-xs text-gray-600 font-medium truncate">
            {order.items.length} item{order.items.length !== 1 ? "s" : ""} — {order.items.slice(0, 2).map(i => `${i.productName} ×${i.quantity}`).join(", ")}
            {order.items.length > 2 ? ` +${order.items.length - 2} more` : ""}
          </p>
        </div>

        {/* Notes */}
        {order.notes && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">📝 {order.notes}</p>
        )}
        {order.deliveryInstructions && (
          <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">🛵 {order.deliveryInstructions}</p>
        )}

        {/* Slot + tip */}
        {(order.deliverySlot || (order.tip ?? 0) > 0) && (
          <div className="flex flex-wrap gap-2">
            {order.deliverySlot && <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">🕒 {order.deliverySlot}</span>}
            {(order.tip ?? 0) > 0 && <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">💚 Tip {formatPrice(order.tip!)}</span>}
          </div>
        )}

        {/* Total */}
        <div className="flex justify-between items-center border-t border-gray-100 pt-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total</span>
          {isFree
            ? <span className="text-base font-extrabold text-emerald-600">FREE <span className="text-xs text-gray-400 line-through font-semibold">{formatPrice(order.total || order.subtotal + order.deliveryFee)}</span></span>
            : <span className="text-lg font-extrabold text-gray-900">{formatPrice(order.total)}</span>}
        </div>
        {isFree && freedNote && (
          <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">🎁 {freedNote}</p>
        )}

        {/* Primary actions */}
        <div className="flex gap-2">
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex-1 flex items-center justify-center gap-1.5 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-700 transition-colors"
          >
            {expanded ? <EyeOff size={13} /> : <Eye size={13} />}
            {expanded ? "Hide" : "Items"}
          </button>

          {(order.address || hasPinned) && (
            <div className="flex-1 flex items-center rounded-xl bg-blue-50 overflow-hidden">
              <button
                onClick={openDirections}
                className="flex-1 flex items-center justify-center gap-1.5 h-10 hover:bg-blue-100 text-xs font-bold text-blue-700 transition-colors"
              >
                <Navigation size={13} /> Dir
              </button>
              {hasPinned && order.address && (
                <button
                  onClick={() => setDestMode(m => m === "pinned" ? "address" : "pinned")}
                  className="h-10 px-2 border-l border-blue-100 text-[10px] font-bold text-blue-600 hover:bg-blue-100 transition-colors flex items-center gap-0.5 shrink-0"
                >
                  <MapPin size={10} />{destMode === "pinned" ? "Live" : "Addr"}
                </button>
              )}
            </div>
          )}

          {order.customerPhone && (
            <a
              href={`tel:+91${order.customerPhone.replace(/\D/g, "").slice(-10)}`}
              className="flex items-center justify-center gap-1.5 h-10 px-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-700 transition-colors"
            >
              <Phone size={13} />
            </a>
          )}

          <button
            onClick={() => setShowMore(v => !v)}
            className={`flex items-center justify-center h-10 px-3 rounded-xl text-xs font-bold transition-colors shrink-0 ${showMore ? "bg-gray-200 text-gray-900 ring-1 ring-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}`}
          >
            <MoreHorizontal size={15} />
          </button>
        </div>

        {/* Secondary actions */}
        {showMore && (
          <div className="flex flex-wrap gap-2 animate-slide-up">
            <button onClick={handleTelegramNotify} disabled={tgSending}
              className="flex items-center gap-1.5 h-9 px-3 bg-sky-50 hover:bg-sky-100 border border-sky-100 rounded-xl text-xs font-bold text-sky-700 transition-colors disabled:opacity-50">
              <Send size={12} /> {tgSending ? "…" : "Telegram"}
            </button>
            {order.customerPhone && (
              <a href={whatsappHref()} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 h-9 px-3 bg-green-50 hover:bg-green-100 border border-green-100 rounded-xl text-xs font-bold text-green-700 transition-colors">
                <MessageSquare size={12} /> WhatsApp
              </a>
            )}
            <button onClick={() => printBill(order)}
              className="flex items-center gap-1.5 h-9 px-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-700 transition-colors">
              <Printer size={12} /> Print
            </button>
            {editable && (
              <button onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 h-9 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-700 transition-colors">
                <Pencil size={12} /> Edit
              </button>
            )}
            {!isFree && (
              <button onClick={() => setShowFree(v => !v)}
                className="flex items-center gap-1.5 h-9 px-3 bg-pink-50 hover:bg-pink-100 border border-pink-100 rounded-xl text-xs font-bold text-pink-700 transition-colors">
                <Gift size={12} /> Free
              </button>
            )}
          </div>
        )}

        {showEdit && (
          <OrderEditSheet orderId={order.id} orderNumber={order.orderNumber} items={order.items}
            onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); onRefresh(); }} />
        )}

        {/* Free order input */}
        {showFree && !isFree && (
          <div className="flex items-center gap-2 bg-pink-50 border border-pink-100 rounded-xl p-2">
            <input value={freeInput} onChange={e => setFreeInput(e.target.value)}
              placeholder="Note for customer…"
              className="flex-1 h-9 px-3 bg-white border border-pink-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-pink-400" />
            <button onClick={makeFree} disabled={freeing}
              className="h-9 px-3 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-lg disabled:opacity-50 shrink-0">
              {freeing ? "…" : "Confirm"}
            </button>
            <button onClick={() => setShowFree(false)} className="h-9 w-9 flex items-center justify-center text-gray-400 shrink-0"><X size={14} /></button>
          </div>
        )}

        {/* Expanded items */}
        {expanded && (
          <div className="bg-gray-50 rounded-xl px-3 py-3 space-y-1.5 animate-slide-up border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Order Items</p>
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700 truncate pr-2">
                  {item.productName}
                  {item.productUnit && <span className="text-gray-400 text-xs ml-1">({item.productUnit})</span>}
                  <span className="text-gray-400 ml-1">×{item.quantity}</span>
                </span>
                <span className="font-bold text-gray-900 shrink-0">{formatPrice(item.total)}</span>
              </div>
            ))}
            <div className="pt-2 mt-1 border-t border-gray-200 space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.deliveryFee > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Delivery</span><span>{formatPrice(order.deliveryFee)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-xs text-emerald-600">
                  <span>Discount</span><span>-{formatPrice(order.discount)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rider assignment */}
        {!["delivered","rejected","cancelled"].includes(order.status) && (
          <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
            <select value={riderId} onChange={e => assignRider(e.target.value)}
              className="flex-1 min-w-0 h-9 px-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none">
              <option value="">Assign rider…</option>
              {riders.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            {order.status === "out_for_delivery" && (
              <button onClick={toggleShareLocation}
                className={`flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold transition-colors ${sharing ? "bg-red-50 text-red-600 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100"}`}>
                <Navigation size={12} /> {sharing ? "Stop" : "Share location"}
              </button>
            )}
          </div>
        )}

        {/* Action buttons */}
        {showRejectReason ? (
          <div className="space-y-2">
            <input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300" />
            <div className="flex gap-2">
              <button onClick={() => setShowRejectReason(false)} className="flex-1 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm text-gray-600 font-semibold transition-colors">Cancel</button>
              <button onClick={handleReject} disabled={updating} className="flex-1 h-10 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50">Reject</button>
            </div>
          </div>
        ) : actions.length > 0 ? (
          <div className="flex gap-2">
            {actions.map(({ next, label, icon: Icon, color }) => (
              <button key={next} onClick={() => handleAction(next)} disabled={updating}
                className={`flex-1 flex items-center justify-center gap-1.5 h-11 ${color} rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97] disabled:opacity-50`}>
                {updating
                  ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <><Icon size={15} /> {label}</>}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function CordPage() {
  const router = useRouter();
  const [orders, setOrders]       = useState<Order[]>([]);
  const [riders, setRiders]       = useState<Rider[]>([]);
  const [filter, setFilter]       = useState<"active" | "all">("active");
  const [loading, setLoading]     = useState(true);
  const [storeOpen, setStoreOpen] = useState<boolean | null>(null);
  const audioRef                  = useRef<HTMLAudioElement | null>(null);
  const lastOrderCount            = useRef(0);

  useEffect(() => {
    fetch("/api/admin/riders").then(r => r.json()).then(d => setRiders((d.riders ?? []).filter((x: Rider) => x.active))).catch(() => {});
    fetch("/api/settings").then(r => r.json()).then(d => setStoreOpen(d.storeOpen ?? true)).catch(() => {});
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res      = await fetch(`/api/cord/orders?filter=${filter}`);
      const data     = await res.json();
      const incoming = data.orders as Order[];

      const pendingCount = incoming.filter(o => o.status === "pending").length;
      if (pendingCount > lastOrderCount.current && lastOrderCount.current >= 0) {
        audioRef.current?.play().catch(() => {});
        toast.success(`${pendingCount} new order${pendingCount > 1 ? "s" : ""}!`, { duration: 5000 });
      }
      lastOrderCount.current = pendingCount;
      document.title = pendingCount > 0 ? `(${pendingCount}) Cord — Sadrax` : "Cord — Sadrax";
      setOrders(incoming);
    } catch { /* silent background fail */ }
    finally  { setLoading(false); }
  }, [filter]);

  useEffect(() => {
    fetchOrders();
    const id = setInterval(fetchOrders, 8000);
    return () => clearInterval(id);
  }, [fetchOrders]);

  const handleStatusUpdate = (id: number, status: OrderStatus) =>
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));

  const activeOrders  = orders.filter(o => !["delivered","rejected","cancelled"].includes(o.status));
  const displayOrders = filter === "active" ? activeOrders : orders;
  const pendingCount  = activeOrders.filter(o => o.status === "pending").length;
  const packedCount   = activeOrders.filter(o => o.status === "packed").length;
  const onRoadCount   = activeOrders.filter(o => o.status === "out_for_delivery").length;

  // Grouped sections for the "active" view
  const sections = [
    { id: "pending",          label: "New Orders",        dot: "bg-orange-500",  pulse: true,  orders: displayOrders.filter(o => o.status === "pending") },
    { id: "accepted",         label: "Preparing",         dot: "bg-blue-500",    pulse: false, orders: displayOrders.filter(o => o.status === "accepted") },
    { id: "packed",           label: "Ready to Dispatch", dot: "bg-violet-500",  pulse: false, orders: displayOrders.filter(o => o.status === "packed") },
    { id: "out_for_delivery", label: "On Road",           dot: "bg-emerald-500", pulse: false, orders: displayOrders.filter(o => o.status === "out_for_delivery") },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f8]">
      <audio ref={audioRef} src="/sounds/new-order.mp3" preload="auto" />

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
        {/* Brand row */}
        <div className="px-3 pt-2.5 pb-2 max-w-2xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 shrink-0 bg-linear-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm shadow-orange-400/30">
              <Zap size={16} className="text-white" fill="white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 leading-none">
                <h1 className="text-sm font-extrabold text-gray-900 tracking-tight">Cord</h1>
                {pendingCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 bg-red-500 text-white text-[9px] font-extrabold rounded-full animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-[10px] text-gray-400">{activeOrders.length} active</p>
                {storeOpen !== null && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${storeOpen ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                    {storeOpen ? "OPEN" : "CLOSED"}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <PanelSwitcher current="cord" />

            <div className="flex bg-gray-100 rounded-xl p-0.5">
              <button onClick={() => setFilter("active")}
                className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === "active" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
                Active
              </button>
              <button onClick={() => setFilter("all")}
                className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
                All
              </button>
            </div>

            <button onClick={fetchOrders}
              className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-500 hover:text-gray-800 transition-colors">
              <RefreshCw size={14} />
            </button>

            <button onClick={async () => { await signOut(); router.replace("/cord/login"); }}
              className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-red-50 rounded-xl text-gray-500 hover:text-red-500 transition-colors"
              title="Sign out">
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* Stats pills inside header */}
        {filter === "active" && activeOrders.length > 0 && (
          <div className="px-3 pb-2.5 max-w-2xl mx-auto grid grid-cols-3 gap-2">
            {[
              { label: "Pending",  count: pendingCount, dot: "bg-orange-500", bg: "bg-orange-50  border-orange-100", text: "text-orange-700", pulse: pendingCount > 0 },
              { label: "Ready",    count: packedCount,  dot: "bg-violet-500", bg: "bg-violet-50  border-violet-100", text: "text-violet-700", pulse: false },
              { label: "On Road",  count: onRoadCount,  dot: "bg-emerald-500", bg: "bg-emerald-50 border-emerald-100", text: "text-emerald-700", pulse: false },
            ].map(({ label, count, dot, bg, text, pulse }) => (
              <div key={label} className={`flex items-center gap-2 ${bg} border rounded-xl px-3 py-2`}>
                <span className={`w-2 h-2 rounded-full shrink-0 ${dot} ${pulse && count > 0 ? "animate-pulse" : ""}`} />
                <span className={`text-base font-extrabold leading-none ${text}`}>{count}</span>
                <span className={`text-[10px] font-semibold leading-none ${text} opacity-70`}>{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto w-full px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-gray-100">
              <Check size={28} className="text-emerald-500" />
            </div>
            <h3 className="font-bold text-gray-800">All clear!</h3>
            <p className="text-sm text-gray-400 mt-1">No {filter === "active" ? "active " : ""}orders right now</p>
          </div>
        ) : filter === "active" ? (
          /* Grouped sections */
          <div className="space-y-1">
            {sections.map(sec => (
              sec.orders.length === 0 ? null :
              <div key={sec.id}>
                <SectionHeader label={sec.label} count={sec.orders.length} dot={sec.dot} pulse={sec.pulse} />
                {/* Ready panel gets extra visual callout */}
                {sec.id === "packed" && (
                  <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 mb-2">
                    <ChevronRight size={13} className="text-violet-600 shrink-0" />
                    <p className="text-xs font-semibold text-violet-700">Assign a rider and dispatch these orders</p>
                  </div>
                )}
                <div className="space-y-3 mb-5">
                  {sec.orders.map(order => (
                    <OrderCard key={order.id} order={order} onUpdate={handleStatusUpdate} onRefresh={fetchOrders} riders={riders} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Flat list for "All" */
          <div className="space-y-3">
            {displayOrders.map(order => (
              <OrderCard key={order.id} order={order} onUpdate={handleStatusUpdate} onRefresh={fetchOrders} riders={riders} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
