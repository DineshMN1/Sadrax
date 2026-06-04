"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, Minus, ShoppingCart, Flame, Check, Heart } from "lucide-react";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useState } from "react";

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
  const { toggle, has } = useWishlist();
  const cartItem = items.find(i => i.id === id);
  const qty      = cartItem?.quantity ?? 0;
  const thumb    = images?.[0];
  const discount = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : null;
  const outOfStock = stock === 0;
  const isHot    = discount && discount >= 20;
  const wished   = has(id);

  const [flash, setFlash] = useState<"idle" | "added" | "inc" | "dec">("idle");

  const fireFlash = (type: "added" | "inc" | "dec") => {
    setFlash(type);
    setTimeout(() => setFlash("idle"), 500);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (outOfStock) return;
    addItem({ id, name, price, mrp: mrp ?? undefined, unit: unit ?? undefined, image: thumb });
    fireFlash("added");
  };

  const handleInc = (e: React.MouseEvent) => { e.preventDefault(); updateQuantity(id, qty + 1); fireFlash("inc"); };
  const handleDec = (e: React.MouseEvent) => { e.preventDefault(); qty === 1 ? removeItem(id) : updateQuantity(id, qty - 1); fireFlash("dec"); };
  const handleWish = (e: React.MouseEvent) => { e.preventDefault(); toggle(id); };

  return (
    <Link
      href={`/product/${id}`}
      className={cn(
        "group relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-all duration-200",
        "hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:-translate-y-0.5",
        flash === "added" && "ring-2 ring-green-400",
        outOfStock && "opacity-70",
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {thumb ? (
          <Image
            src={thumb}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
            className={cn(
              "object-cover transition-transform duration-500 group-hover:scale-[1.07]",
              flash === "added" && "scale-[1.04]"
            )}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100">
            <ShoppingCart size={28} className="text-gray-200" />
          </div>
        )}

        {/* Discount badge */}
        {discount && !outOfStock && (
          <div className={cn(
            "absolute top-2 left-2 text-white text-[10px] font-extrabold px-2 py-1 rounded-full shadow-sm flex items-center gap-0.5",
            isHot ? "bg-linear-to-r from-orange-500 to-red-500" : "bg-linear-to-r from-green-500 to-emerald-500"
          )}>
            {isHot && <Flame size={9} fill="white" />}
            {discount}% OFF
          </div>
        )}

        {/* Wishlist button */}
        <button
          onClick={handleWish}
          className={cn(
            "absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-sm transition-all",
            wished ? "bg-red-500" : "bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100"
          )}
        >
          <Heart size={12} className={cn(wished ? "text-white fill-white" : "text-gray-400")} />
        </button>

        {/* Low stock badge */}
        {stock > 0 && stock <= 5 && qty === 0 && (
          <div className="absolute bottom-2 left-2 bg-orange-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
            Only {stock} left!
          </div>
        )}

        {/* Qty badge */}
        {qty > 0 && (
          <div className={cn(
            "absolute top-2 right-2 w-5 h-5 bg-green-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-sm shadow-green-500/40 transition-all duration-200",
            (flash === "inc" || flash === "added") && "scale-125 bg-emerald-500",
            wished && "hidden"
          )}>
            {qty}
          </div>
        )}

        {/* Added flash */}
        {flash === "added" && (
          <div className="absolute inset-0 bg-green-500/15 flex items-center justify-center pointer-events-none animate-bounce-in">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
              <Check size={20} className="text-white" strokeWidth={3} />
            </div>
          </div>
        )}

        {/* Out of stock */}
        {outOfStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-[11px] font-bold text-gray-500 bg-white/95 px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
              Out of stock
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-2.5 gap-1">
        {unit && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{unit}</p>}
        <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 flex-1">{name}</p>

        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-sm font-extrabold text-gray-900">{formatPrice(price)}</span>
          {mrp && mrp > price && (
            <span className="text-[11px] text-gray-400 line-through">{formatPrice(mrp)}</span>
          )}
        </div>

        {/* Stepper / Add */}
        <div className="mt-1.5">
          {qty === 0 ? (
            <button
              onClick={handleAdd}
              disabled={outOfStock}
              className={cn(
                "w-full h-8 flex items-center justify-center gap-1 rounded-xl text-sm font-bold transition-all active:scale-90",
                "bg-green-50 border border-green-300 text-green-700",
                "hover:bg-green-500 hover:text-white hover:border-green-500 hover:shadow-md hover:shadow-green-500/25",
                "disabled:opacity-40 disabled:pointer-events-none"
              )}
            >
              <Plus size={13} strokeWidth={3} />
              ADD
            </button>
          ) : (
            <div className={cn(
              "flex items-center justify-between h-8 bg-linear-to-r from-green-500 to-emerald-500 rounded-xl px-1 shadow-md shadow-green-500/30 transition-all duration-150",
              flash === "inc" && "scale-[1.04]",
              flash === "dec" && "scale-[0.97]"
            )}>
              <button onClick={handleDec} className="w-6 h-6 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-colors active:scale-90">
                <Minus size={13} strokeWidth={3} />
              </button>
              <span className="text-white text-sm font-extrabold min-w-6 text-center tabular-nums">{qty}</span>
              <button onClick={handleInc} className="w-6 h-6 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-colors active:scale-90">
                <Plus size={13} strokeWidth={3} />
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="aspect-square skeleton" />
      <div className="p-2.5 space-y-2">
        <div className="h-2.5 w-10 skeleton rounded-lg" />
        <div className="h-4 w-full skeleton rounded-lg" />
        <div className="h-4 w-2/3 skeleton rounded-lg" />
        <div className="h-4 w-1/3 skeleton rounded-lg" />
        <div className="h-8 w-full skeleton rounded-xl mt-1" />
      </div>
    </div>
  );
}
