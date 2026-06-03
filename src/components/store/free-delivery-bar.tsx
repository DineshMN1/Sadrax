"use client";

import { useCart } from "@/store/cart";
import { formatPrice, FREE_DELIVERY_THRESHOLD } from "@/lib/utils";
import { Truck, CheckCircle2 } from "lucide-react";

export function FreeDeliveryBar() {
  const subtotal  = useCart(s => s.subtotal());
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const progress  = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);
  const isFree    = subtotal >= FREE_DELIVERY_THRESHOLD;

  if (isFree) {
    return (
      <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
        <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center shrink-0">
          <CheckCircle2 size={15} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-extrabold text-green-800">Free delivery unlocked! 🎉</p>
          <p className="text-xs text-green-600 mt-0.5">Your order qualifies for free delivery.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck size={14} className="text-gray-500" />
          <p className="text-xs text-gray-600">
            Add <span className="font-extrabold text-gray-900">{formatPrice(remaining)}</span> more for free delivery
          </p>
        </div>
        <span className="text-[10px] font-bold text-gray-400">{Math.round(progress)}%</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
