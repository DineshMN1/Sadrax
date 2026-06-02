"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Trash2, Plus, Minus, Tag } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/store/cart";
import { FreeDeliveryBar } from "@/components/store/free-delivery-bar";
import { formatPrice, DELIVERY_FEE } from "@/lib/utils";
import { toast } from "sonner";

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, subtotal, deliveryFee, total, discount, couponCode, applyCoupon, removeCoupon } = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [applying, setApplying] = useState(false);

  const sub = subtotal();
  const fee = deliveryFee();
  const tot = total();

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
        toast.success(`Coupon applied! You save ${formatPrice(data.discount)}`);
        setCouponInput("");
      }
    } catch {
      toast.error("Could not apply coupon");
    } finally {
      setApplying(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <span className="text-7xl mb-4">🛒</span>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add some groceries to get started</p>
        <Link href="/" className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">My Cart</h1>
        <span className="ml-auto text-sm text-gray-400">{items.reduce((s, i) => s + i.quantity, 0)} items</span>
      </div>

      <div className="px-4 py-4 space-y-4 flex-1">
        <FreeDeliveryBar />

        {/* Cart items */}
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3">
              <div className="w-14 h-14 rounded-xl bg-gray-50 overflow-hidden shrink-0">
                {item.image ? (
                  <Image src={item.image} alt={item.name} width={56} height={56} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🛒</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                {item.unit && <p className="text-xs text-gray-400">{item.unit}</p>}
                <p className="text-sm font-bold text-gray-900 mt-0.5">{formatPrice(item.price)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => item.quantity === 1 ? removeItem(item.id) : updateQuantity(item.id, item.quantity - 1)}
                  className="w-7 h-7 flex items-center justify-center bg-green-50 border border-green-200 text-green-600 rounded-lg"
                >
                  {item.quantity === 1 ? <Trash2 size={12} /> : <Minus size={12} strokeWidth={3} />}
                </button>
                <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-7 h-7 flex items-center justify-center bg-green-500 text-white rounded-lg"
                >
                  <Plus size={12} strokeWidth={3} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Coupon */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag size={16} className="text-green-600" />
            <span className="text-sm font-semibold text-gray-900">Apply Coupon</span>
          </div>
          {couponCode ? (
            <div className="flex items-center justify-between bg-green-50 rounded-xl px-3 py-2">
              <span className="text-sm font-bold text-green-700">{couponCode} applied</span>
              <button onClick={removeCoupon} className="text-xs text-red-500 font-semibold">Remove</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="flex-1 h-10 px-3 rounded-xl bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/30"
                onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
              />
              <button
                onClick={handleApplyCoupon}
                disabled={applying || !couponInput.trim()}
                className="px-4 h-10 bg-green-600 text-white text-sm font-semibold rounded-xl disabled:opacity-50"
              >
                {applying ? "..." : "Apply"}
              </button>
            </div>
          )}
        </div>

        {/* Bill summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Bill Summary</h3>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatPrice(sub)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Delivery</span>
            <span className={fee === 0 ? "text-green-600 font-semibold" : ""}>
              {fee === 0 ? "FREE" : formatPrice(fee)}
            </span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Coupon discount</span>
              <span className="text-green-600 font-semibold">-{formatPrice(discount)}</span>
            </div>
          )}
          <div className="border-t border-gray-100 pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span>{formatPrice(tot)}</span>
          </div>
        </div>
      </div>

      {/* Checkout CTA */}
      <div className="sticky bottom-16 px-4 pb-3 bg-linear-to-t from-gray-50 pt-2">
        <Link
          href="/checkout"
          className="flex items-center justify-between w-full bg-green-600 text-white px-5 py-3.5 rounded-2xl font-semibold shadow-lg shadow-green-600/30"
        >
          <span>Proceed to Checkout</span>
          <span>{formatPrice(tot)}</span>
        </Link>
      </div>
    </div>
  );
}
