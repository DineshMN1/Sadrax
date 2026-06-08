"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, Minus, ShoppingCart, Flame, Check, Heart, Bell, BellRing, Loader2 } from "lucide-react";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";

type VariantItem = { unit: string; price: number; mrp?: number | null; stock: number; image?: string | null };

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  mrp?: number | null;
  unit?: string | null;
  images?: string[];
  stock: number;
  veg?: string | null;
  className?: string;
  variants?: VariantItem[];
}

export function ProductCard({ id, name, price, mrp, unit, images, stock, veg, className, variants }: ProductCardProps) {
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const { toggle, has } = useWishlist();
  const thumb = images?.[0];
  const wished = has(id);

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [flash, setFlash]             = useState<"idle" | "added" | "inc" | "dec">("idle");
  const [notifyState, setNotifyState] = useState<"idle" | "loading" | "done">("idle");

  const hasVariants = variants && variants.length > 1;

  // Active variant data
  const active = useMemo((): VariantItem => {
    if (hasVariants) return variants![selectedIdx] ?? variants![0];
    return { price, mrp: mrp ?? null, stock, unit: unit ?? "" };
  }, [hasVariants, variants, selectedIdx, price, mrp, stock, unit]);

  const variantIdx    = hasVariants ? selectedIdx : 0;
  const displayThumb  = (active as VariantItem).image || thumb;
  const cartItem      = items.find(i => i.id === id && i.variantIdx === variantIdx);
  const qty       = cartItem?.quantity ?? 0;
  const discount  = active.mrp && active.mrp > active.price ? Math.round(((active.mrp - active.price) / active.mrp) * 100) : null;
  const outOfStock = active.stock === 0;
  const atMax     = qty >= active.stock;
  const isHot     = discount && discount >= 20;

  const fireFlash = (type: "added" | "inc" | "dec") => {
    setFlash(type);
    setTimeout(() => setFlash("idle"), 500);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (outOfStock) return;
    addItem({ id, variantIdx, name, price: active.price, mrp: active.mrp ?? undefined, unit: active.unit ?? undefined, image: displayThumb });
    fireFlash("added");
  };

  const handleInc = (e: React.MouseEvent) => { e.preventDefault(); if (atMax) return; updateQuantity(id, qty + 1, variantIdx); fireFlash("inc"); };
  const handleDec = (e: React.MouseEvent) => { e.preventDefault(); qty === 1 ? removeItem(id, variantIdx) : updateQuantity(id, qty - 1, variantIdx); fireFlash("dec"); };
  const handleWish = (e: React.MouseEvent) => { e.preventDefault(); toggle(id); };

  const handleNotify = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (notifyState !== "idle") return;
    setNotifyState("loading");
    try {
      const res = await fetch("/api/stock-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id }),
      });
      if (res.status === 401) {
        window.location.href = `/login?redirect=/product/${id}`;
        return;
      }
      setNotifyState("done");
    } catch {
      setNotifyState("idle");
    }
  };

  return (
    <Link
      href={`/product/${id}`}
      className={cn(
        "group relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-all duration-200",
        "hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:-translate-y-0.5",
        flash === "added" && "ring-2 ring-green-400",
        outOfStock && "border-gray-100",
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {displayThumb ? (
          <Image
            src={displayThumb}
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
        {active.stock > 0 && active.stock <= 5 && (
          <div className="absolute bottom-2 left-2 bg-orange-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
            Only {active.stock} left!
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
          <div className="absolute inset-0 flex items-end justify-center pb-2">
            <span className="text-[11px] font-bold text-gray-400 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
              Out of stock
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-2.5 gap-1">
        <div className="flex items-center gap-1.5">
          {veg && (
            <span className={`inline-flex w-3.5 h-3.5 items-center justify-center border rounded-xs shrink-0 ${veg === "veg" ? "border-green-600" : "border-red-600"}`} title={veg === "veg" ? "Veg" : "Non-veg"}>
              <span className={`w-1.5 h-1.5 rounded-full ${veg === "veg" ? "bg-green-600" : "bg-red-600"}`} />
            </span>
          )}
          {!hasVariants && active.unit && (
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{active.unit}</p>
          )}
        </div>
        <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 flex-1">{name}</p>

        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-sm font-extrabold text-gray-900">{formatPrice(active.price)}</span>
          {active.mrp && active.mrp > active.price && (
            <span className="text-[11px] text-gray-400 line-through">{formatPrice(active.mrp)}</span>
          )}
        </div>

        {/* Variant pills */}
        {hasVariants && (
          <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-0.5 px-0.5 mt-0.5">
            {variants!.map((v, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedIdx(i); }}
                className={cn(
                  "shrink-0 h-6 px-2 rounded-lg text-[10px] font-bold border transition-all whitespace-nowrap",
                  i === selectedIdx
                    ? "bg-green-500 border-green-500 text-white"
                    : v.stock === 0
                    ? "bg-gray-50 border-gray-200 text-gray-300 line-through"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:border-green-300"
                )}
              >
                {v.unit}
              </button>
            ))}
          </div>
        )}

        {/* Stepper / Add / Notify */}
        <div className="mt-1.5">
          {outOfStock ? (
            <button
              onClick={handleNotify}
              className={cn(
                "w-full h-8 flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-all active:scale-90",
                notifyState === "done"
                  ? "bg-violet-100 border border-violet-300 text-violet-700"
                  : "bg-violet-50 border border-violet-200 text-violet-600 hover:bg-violet-100 hover:border-violet-300"
              )}
            >
              {notifyState === "loading" ? (
                <Loader2 size={11} className="animate-spin" />
              ) : notifyState === "done" ? (
                <><BellRing size={11} /> Notified</>
              ) : (
                <><Bell size={11} /> Notify me</>
              )}
            </button>
          ) : qty === 0 ? (
            <button
              onClick={handleAdd}
              className={cn(
                "w-full h-8 flex items-center justify-center gap-1 rounded-xl text-sm font-bold transition-all active:scale-90",
                "bg-green-50 border border-green-300 text-green-700",
                "hover:bg-green-500 hover:text-white hover:border-green-500 hover:shadow-md hover:shadow-green-500/25",
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
              <button onClick={handleInc} disabled={atMax} className="w-6 h-6 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-colors active:scale-90 disabled:opacity-40 disabled:pointer-events-none">
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
