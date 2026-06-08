"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Trash2, Plus, Minus, Tag, ShoppingBag, ArrowRight, Sparkles, AlertTriangle, Truck } from "lucide-react";
import { LottiePlayer } from "@/components/lottie-player";
import emptyBoxAnim from "@/lottie/empty-box.json";
import { useState, useEffect, useMemo } from "react";
import { useCart } from "@/store/cart";
import { FreeDeliveryBar } from "@/components/store/free-delivery-bar";
import { formatPrice } from "@/lib/utils";
import { useStoreConfig } from "@/store/config";
import { primeCoords } from "@/lib/geo";
import { toast } from "sonner";

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, subtotal, deliveryFee, total, discount, couponCode, applyCoupon, removeCoupon } = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [applying, setApplying] = useState(false);

  // Live stock for the products in the cart. The cart is persisted in
  // localStorage and can go stale, so we re-check against the server.
  const [stockMap, setStockMap] = useState<Record<number, number>>({});
  const [stockLoaded, setStockLoaded] = useState(false);

  // Refetch only when the *set* of product ids changes (not on qty change)
  const idsKey = useMemo(
    () => [...new Set(items.map(i => i.id))].sort((a, b) => a - b).join(","),
    [items]
  );

  useEffect(() => {
    if (!idsKey) { setStockMap({}); setStockLoaded(true); return; }
    let cancelled = false;
    fetch(`/api/products?ids=${idsKey}`)
      .then(r => r.json())
      .then((d: { products?: { id: number; stock: number }[] }) => {
        if (cancelled) return;
        const m: Record<number, number> = {};
        for (const p of d.products ?? []) m[p.id] = p.stock;
        setStockMap(m);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setStockLoaded(true); });
    return () => { cancelled = true; };
  }, [idsKey]);

  // Once loaded, a product missing from the response is unavailable (stock 0)
  const stockOf = (id: number): number | undefined =>
    stockLoaded ? (stockMap[id] ?? 0) : undefined;

  const hasStockIssue =
    stockLoaded && items.some(i => i.quantity > (stockMap[i.id] ?? 0));

  const cfgDeliveryFee = useStoreConfig(s => s.deliveryFee);
  const minOrderValue  = useStoreConfig(s => s.minOrderValue);
  const freeDeliveryThreshold = useStoreConfig(s => s.freeDeliveryThreshold);
  const storeOpen      = useStoreConfig(s => s.storeOpen);
  const sub = subtotal();
  const fee = deliveryFee();
  const tot = total();
  const savings = discount + (fee === 0 && sub > 0 ? cfgDeliveryFee : 0);
  const belowMin = sub > 0 && sub < minOrderValue;
  // Non-blocking nudge: eligible to check out, but a bit more unlocks free delivery
  const freeDeliveryGap = !belowMin && !hasStockIssue && fee > 0 && sub > 0 ? freeDeliveryThreshold - sub : 0;
  const unlockedFreeDelivery = !belowMin && !hasStockIssue && fee === 0 && sub > 0;

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setApplying(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput.trim().toUpperCase(), subtotal: sub }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Invalid coupon");
      } else {
        applyCoupon(data.code, data.discount);
        toast.success(`Coupon applied!`, { description: `You save ${formatPrice(data.discount)}` });
        setCouponInput("");
      }
    } catch {
      toast.error("Could not apply coupon. Try again.");
    } finally {
      setApplying(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="w-44 h-44 mb-1">
          <LottiePlayer animationData={emptyBoxAnim} loop className="w-full h-full" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 text-sm mb-6 max-w-xs">Add some groceries to get started on your order</p>
        <Link
          href="/"
          className="flex items-center gap-2 bg-linear-to-r from-green-600 to-emerald-600 text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-green-600/30 hover:shadow-xl hover:shadow-green-600/40 transition-all"
        >
          <ShoppingBag size={16} /> Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 glass border-b border-gray-100/80 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <ChevronLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="text-lg font-extrabold text-gray-900">My Cart</h1>
        <span className="ml-auto text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
          {items.reduce((s, i) => s + i.quantity, 0)} items
        </span>
      </div>

      <div className="px-4 py-4 space-y-4 flex-1">
        <FreeDeliveryBar />

        {/* Items */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          {items.map(item => {
            const stock = stockOf(item.id);
            const out  = stock !== undefined && stock === 0;
            const over = stock !== undefined && stock > 0 && item.quantity > stock;
            const low  = stock !== undefined && stock > 0 && stock <= 5;
            const atMax = stock !== undefined && item.quantity >= stock;
            return (
            <div key={item.id} className="flex items-center gap-3 p-3 group">
              <div className="w-14 h-14 rounded-xl bg-gray-50 overflow-hidden shrink-0 border border-gray-100">
                {item.image
                  ? <Image src={item.image} alt={item.name} width={56} height={56} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl">🛒</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                {item.unit && <p className="text-xs text-gray-400 mt-0.5">{item.unit}</p>}
                <p className="text-sm font-extrabold text-gray-900 mt-1">{formatPrice(item.price)}</p>
                {out ? (
                  <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                    <AlertTriangle size={11} /> Out of stock
                  </span>
                ) : over ? (
                  <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                    <AlertTriangle size={11} /> Only {stock} left — reduce quantity
                  </span>
                ) : low ? (
                  <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    Only {stock} left
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => item.quantity === 1 ? removeItem(item.id) : updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-600 rounded-xl hover:bg-red-50 hover:border-red-200 hover:text-red-500 active:scale-90 transition-all"
                >
                  {item.quantity === 1 ? <Trash2 size={12} /> : <Minus size={12} strokeWidth={3} />}
                </button>
                <span className="w-7 text-center text-sm font-extrabold tabular-nums">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  disabled={atMax}
                  className="w-8 h-8 flex items-center justify-center bg-green-500 text-white rounded-xl hover:bg-green-600 active:scale-90 transition-all shadow-sm shadow-green-500/30 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Plus size={12} strokeWidth={3} />
                </button>
              </div>
            </div>
            );
          })}
        </div>

        {/* Coupon */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-linear-to-br from-green-50 to-emerald-100 rounded-xl flex items-center justify-center">
              <Tag size={14} className="text-green-600" />
            </div>
            <span className="text-sm font-bold text-gray-900">Apply Coupon</span>
          </div>
          {couponCode ? (
            <div className="flex items-center justify-between bg-linear-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl px-3 py-3">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-green-600" />
                <div>
                  <p className="text-sm font-extrabold text-green-700 font-mono">{couponCode}</p>
                  <p className="text-xs text-green-600 mt-0.5">You save {formatPrice(discount)}</p>
                </div>
              </div>
              <button onClick={removeCoupon} className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors">
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={couponInput}
                onChange={e => setCouponInput(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                onKeyDown={e => e.key === "Enter" && handleApplyCoupon()}
                className="flex-1 h-11 px-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-mono uppercase tracking-wider focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all"
              />
              <button
                onClick={handleApplyCoupon}
                disabled={applying || !couponInput.trim()}
                className="px-5 h-11 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 disabled:opacity-40 transition-colors"
              >
                {applying ? "..." : "Apply"}
              </button>
            </div>
          )}
        </div>

        {/* Bill Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-extrabold text-gray-900 mb-4">Bill Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold text-gray-900">{formatPrice(sub)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Delivery fee</span>
              {fee === 0
                ? <span className="text-green-600 font-bold">FREE</span>
                : <span className="font-semibold text-gray-900">{formatPrice(fee)}</span>}
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Coupon ({couponCode})</span>
                <span className="text-green-600 font-bold">−{formatPrice(discount)}</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-3 flex justify-between font-extrabold text-base">
              <span className="text-gray-900">Total</span>
              <span className="text-green-600">{formatPrice(tot)}</span>
            </div>
            {savings > 0 && (
              <div className="bg-linear-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl py-2.5 px-3 text-center">
                <p className="text-xs font-bold text-green-700">🎉 You save {formatPrice(savings)} on this order!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="sticky bottom-20 md:bottom-0 px-4 pb-3 pt-3 bg-linear-to-t from-gray-50 via-gray-50/90 to-transparent space-y-2.5">
        {hasStockIssue && (
          <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
            <AlertTriangle size={15} className="text-red-500 shrink-0" />
            <p className="text-xs font-semibold text-red-700">
              Some items are out of stock. Adjust the quantities above to continue.
            </p>
          </div>
        )}
        {!hasStockIssue && belowMin && (
          <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5">
            <AlertTriangle size={15} className="text-amber-500 shrink-0" />
            <p className="text-xs font-semibold text-amber-700">
              Add {formatPrice(minOrderValue - sub)} more to reach the {formatPrice(minOrderValue)} minimum order.
            </p>
          </div>
        )}
        {freeDeliveryGap > 0 && (
          <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-xl px-3.5 py-2.5">
            <Truck size={15} className="text-green-600 shrink-0" />
            <p className="text-xs font-semibold text-green-700">
              Add {formatPrice(freeDeliveryGap)} more to get <span className="font-extrabold">FREE delivery!</span>
            </p>
          </div>
        )}
        {unlockedFreeDelivery && (
          <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-xl px-3.5 py-2.5">
            <Truck size={15} className="text-green-600 shrink-0" />
            <p className="text-xs font-semibold text-green-700">
              You&rsquo;ve unlocked <span className="font-extrabold">FREE delivery</span> on this order!
            </p>
          </div>
        )}
        {!storeOpen ? (
          <div
            aria-disabled
            className="flex items-center justify-between w-full bg-amber-100 border border-amber-200 text-amber-700 px-5 py-4 rounded-2xl font-bold cursor-not-allowed select-none"
          >
            <span className="text-base">Store is closed</span>
            <span className="text-xs font-semibold opacity-70">Orders paused</span>
          </div>
        ) : hasStockIssue || belowMin ? (
          <div
            aria-disabled
            className="flex items-center justify-between w-full bg-gray-300 text-white px-5 py-4 rounded-2xl font-bold cursor-not-allowed select-none"
          >
            <span className="text-base">{belowMin && !hasStockIssue ? `Minimum ${formatPrice(minOrderValue)}` : "Proceed to Checkout"}</span>
            <span className="text-base font-extrabold">{formatPrice(tot)}</span>
          </div>
        ) : (
          <Link
            href="/checkout"
            onClick={() => primeCoords()}
            className="flex items-center justify-between w-full bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-5 py-4 rounded-2xl font-bold shadow-lg shadow-green-600/30 active:scale-[0.98] transition-all"
          >
            <span className="text-base">Proceed to Checkout</span>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold">{formatPrice(tot)}</span>
              <div className="w-7 h-7 bg-white/20 rounded-xl flex items-center justify-center">
                <ArrowRight size={16} />
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
