"use client";

import { useCart } from "@/store/cart";
import { formatPrice, FREE_DELIVERY_THRESHOLD } from "@/lib/utils";

export function FreeDeliveryBar() {
  const subtotal = useCart((s) => s.subtotal());
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);

  if (subtotal >= FREE_DELIVERY_THRESHOLD) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm text-green-700 font-semibold text-center">
        You got free delivery!
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-2">
      <p className="text-xs text-gray-600">
        Add{" "}
        <span className="font-bold text-gray-900">{formatPrice(remaining)}</span>{" "}
        more for free delivery
      </p>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
