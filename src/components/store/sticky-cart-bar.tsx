"use client";

import Link from "next/link";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function StickyCartBar({ className }: { className?: string }) {
  const items    = useCart(s => s.items);
  const total    = useCart(s => s.total());
  const itemCount = useCart(s => s.itemCount());

  if (itemCount === 0) return null;

  return (
    <div className={cn("fixed bottom-15 left-0 right-0 z-30 px-4 pb-1.5", className)}>
      <Link
        href="/cart"
        className="max-w-lg mx-auto flex items-center justify-between bg-green-600 text-white px-4 py-3 rounded-2xl shadow-lg shadow-green-600/40 active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <ShoppingCart size={18} />
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white text-green-600 text-[9px] font-extrabold rounded-full flex items-center justify-center">
              {itemCount > 9 ? "9+" : itemCount}
            </span>
          </div>
          <span className="text-sm font-bold">
            {itemCount} item{itemCount !== 1 ? "s" : ""} in cart
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-extrabold">{formatPrice(total)}</span>
          <ArrowRight size={14} />
        </div>
      </Link>
    </div>
  );
}
