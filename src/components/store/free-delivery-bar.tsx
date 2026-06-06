"use client";

import { useCart } from "@/store/cart";
import { useStoreConfig } from "@/store/config";
import { formatPrice } from "@/lib/utils";
import { Truck, CheckCircle2 } from "lucide-react";

export function FreeDeliveryBar() {
  const subtotal  = useCart(s => s.subtotal());
  const threshold = useStoreConfig(s => s.freeDeliveryThreshold);
  const remaining = Math.max(0, threshold - subtotal);
  const progress  = Math.min(100, (subtotal / threshold) * 100);
  const isFree    = subtotal >= threshold;

  if (isFree) {
    return (
      <div className="flex items-center gap-3 bg-linear-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl px-4 py-3">
        <div className="w-9 h-9 bg-linear-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-green-500/30">
          <CheckCircle2 size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-extrabold text-green-800">Free delivery unlocked! 🎉</p>
          <p className="text-xs text-green-600 mt-0.5">Your order qualifies for free delivery.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 space-y-2.5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck size={14} className="text-green-600" />
          <p className="text-xs text-gray-600">
            Add <span className="font-extrabold text-gray-900">{formatPrice(remaining)}</span> for free delivery
          </p>
        </div>
        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{Math.round(progress)}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-linear-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
