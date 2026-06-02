"use client";

import Image from "next/image";
import { Plus, Minus } from "lucide-react";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  mrp?: number | null;
  unit?: string | null;
  images?: string[];
  stock: number;
  className?: string;
}

export function ProductCard({
  id,
  name,
  price,
  mrp,
  unit,
  images,
  stock,
  className,
}: ProductCardProps) {
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const cartItem = items.find((i) => i.id === id);
  const quantity = cartItem?.quantity ?? 0;
  const thumb = images?.[0];
  const discount = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : null;

  const handleAdd = () => {
    addItem({
      id,
      name,
      price,
      mrp: mrp ?? undefined,
      unit: unit ?? undefined,
      image: thumb,
    });
  };

  const handleIncrease = () => updateQuantity(id, quantity + 1);
  const handleDecrease = () => {
    if (quantity === 1) removeItem(id);
    else updateQuantity(id, quantity - 1);
  };

  return (
    <div className={cn("bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col", className)}>
      <div className="relative aspect-square bg-gray-50">
        {thumb ? (
          <Image
            src={thumb}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 200px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">
            🛒
          </div>
        )}
        {discount && (
          <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {discount}% OFF
          </span>
        )}
        {stock === 0 && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-xs font-semibold text-gray-500">Out of stock</span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-2.5 gap-1">
        <p className="text-xs text-gray-400 font-medium">{unit}</p>
        <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{name}</p>
        <div className="flex items-baseline gap-1.5 mt-auto">
          <span className="text-sm font-bold text-gray-900">{formatPrice(price)}</span>
          {mrp && mrp > price && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(mrp)}</span>
          )}
        </div>

        <div className="mt-2">
          {quantity === 0 ? (
            <button
              onClick={handleAdd}
              disabled={stock === 0}
              className="w-full h-8 bg-green-50 border border-green-500 text-green-600 text-sm font-bold rounded-xl hover:bg-green-500 hover:text-white transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              ADD
            </button>
          ) : (
            <div className="flex items-center justify-between h-8 bg-green-500 rounded-xl px-1">
              <button
                onClick={handleDecrease}
                className="w-7 h-7 flex items-center justify-center text-white hover:bg-green-600 rounded-lg transition-colors"
              >
                <Minus size={14} strokeWidth={3} />
              </button>
              <span className="text-white text-sm font-bold min-w-[20px] text-center">
                {quantity}
              </span>
              <button
                onClick={handleIncrease}
                className="w-7 h-7 flex items-center justify-center text-white hover:bg-green-600 rounded-lg transition-colors"
              >
                <Plus size={14} strokeWidth={3} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="aspect-square bg-gray-100 animate-pulse" />
      <div className="p-2.5 space-y-2">
        <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
        <div className="h-8 w-full bg-gray-100 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
