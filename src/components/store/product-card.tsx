"use client";

import Image from "next/image";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

export function ProductCard({ id, name, price, mrp, unit, images, stock, className }: ProductCardProps) {
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const cartItem = items.find(i => i.id === id);
  const qty = cartItem?.quantity ?? 0;
  const thumb = images?.[0];
  const discount = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : null;
  const outOfStock = stock === 0;

  const handleAdd = () => {
    if (outOfStock) return;
    addItem({ id, name, price, mrp: mrp ?? undefined, unit: unit ?? undefined, image: thumb });
    toast.success(`${name} added`, {
      duration: 1500,
      position: "bottom-center",
      classNames: { toast: "!mb-20" },
    });
  };

  const handleInc = () => updateQuantity(id, qty + 1);
  const handleDec = () => qty === 1 ? removeItem(id) : updateQuantity(id, qty - 1);

  return (
    <div className={cn(
      "group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-shadow hover:shadow-md",
      outOfStock && "opacity-75",
      className
    )}>
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {thumb ? (
          <Image
            src={thumb}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ShoppingCart size={28} className="text-gray-200" />
          </div>
        )}

        {/* Discount badge */}
        {discount && !outOfStock && (
          <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm">
            {discount}% OFF
          </div>
        )}

        {/* Out of stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
            <span className="text-[11px] font-bold text-gray-500 bg-white/90 px-2.5 py-1 rounded-full border border-gray-200">
              Out of stock
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-2.5 gap-1">
        {unit && <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{unit}</p>}
        <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 flex-1">{name}</p>

        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-sm font-extrabold text-gray-900">{formatPrice(price)}</span>
          {mrp && mrp > price && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(mrp)}</span>
          )}
        </div>

        {/* Stepper / Add */}
        <div className="mt-1.5">
          {qty === 0 ? (
            <button
              onClick={handleAdd}
              disabled={outOfStock}
              className="w-full h-8 flex items-center justify-center gap-1 bg-green-50 border border-green-400 text-green-700 text-sm font-bold rounded-xl hover:bg-green-500 hover:text-white hover:border-green-500 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              <Plus size={13} strokeWidth={3} />
              ADD
            </button>
          ) : (
            <div className="flex items-center justify-between h-8 bg-green-500 rounded-xl px-1 shadow-sm shadow-green-500/30">
              <button
                onClick={handleDec}
                className="w-6 h-6 flex items-center justify-center text-white hover:bg-green-600 rounded-lg transition-colors active:scale-90"
              >
                <Minus size={13} strokeWidth={3} />
              </button>
              <span className="text-white text-sm font-extrabold min-w-[1.5rem] text-center tabular-nums">
                {qty}
              </span>
              <button
                onClick={handleInc}
                className="w-6 h-6 flex items-center justify-center text-white hover:bg-green-600 rounded-lg transition-colors active:scale-90"
              >
                <Plus size={13} strokeWidth={3} />
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
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-100" />
      <div className="p-2.5 space-y-2">
        <div className="h-2.5 w-10 bg-gray-100 rounded" />
        <div className="h-4 w-full bg-gray-100 rounded" />
        <div className="h-4 w-2/3 bg-gray-100 rounded" />
        <div className="h-4 w-1/3 bg-gray-100 rounded" />
        <div className="h-8 w-full bg-gray-100 rounded-xl mt-1" />
      </div>
    </div>
  );
}
