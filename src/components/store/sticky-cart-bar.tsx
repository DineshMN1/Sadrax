"use client";

import Link from "next/link";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function StickyCartBar({ className }: { className?: string }) {
  const items     = useCart(s => s.items);
  const total     = useCart(s => s.total());
  const itemCount = useCart(s => s.itemCount());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || itemCount === 0) return null;

  return (
    <div className={cn("fixed bottom-16 left-0 right-0 z-30 px-4 pb-1.5", className)}>
      <Link
        href="/cart"
        className="max-w-lg mx-auto flex items-center justify-between bg-linear-to-r from-green-600 to-emerald-600 text-white px-4 py-3.5 rounded-2xl shadow-xl shadow-green-600/40 active:scale-[0.98] transition-all hover:shadow-green-600/50"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <ShoppingCart size={17} />
            </div>
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white text-green-600 text-[9px] font-extrabold rounded-full flex items-center justify-center shadow-sm">
              {itemCount > 9 ? "9+" : itemCount}
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-green-100 leading-none mb-0.5">{itemCount} item{itemCount !== 1 ? "s" : ""}</p>
            <p className="text-sm font-extrabold leading-none">View Cart</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-extrabold">{formatPrice(total)}</span>
          <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
            <ArrowRight size={13} />
          </div>
        </div>
      </Link>
    </div>
  );
}
