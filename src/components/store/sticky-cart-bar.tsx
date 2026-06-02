"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function StickyCartBar({ className }: { className?: string }) {
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total());
  const itemCount = useCart((s) => s.itemCount());

  if (itemCount === 0) return null;

  return (
    <div className={cn("fixed bottom-[60px] left-0 right-0 z-30 px-4 pb-2", className)}>
      <Link
        href="/cart"
        className="max-w-lg mx-auto flex items-center justify-between bg-green-600 text-white px-4 py-3 rounded-2xl shadow-lg shadow-green-600/30 active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-2">
          <ShoppingCart size={18} />
          <span className="text-sm font-semibold">
            {itemCount} item{itemCount !== 1 ? "s" : ""}
          </span>
        </div>
        <span className="text-sm font-bold">{formatPrice(total)} →</span>
      </Link>
    </div>
  );
}
