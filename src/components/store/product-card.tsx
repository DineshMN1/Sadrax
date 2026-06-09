"use client";

import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { Plus, Minus, ShoppingCart, Flame, Check, Heart, Bell, BellRing, Loader2, X, ChevronDown } from "lucide-react";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect } from "react";

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

  const [flash, setFlash]             = useState<"idle" | "added" | "inc" | "dec">("idle");
  const [notifyState, setNotifyState] = useState<"idle" | "loading" | "done">("idle");
  const [sheetOpen, setSheetOpen]     = useState(false);

  const hasVariants = !!variants && variants.length > 1;

  // Headline shown on the card. For variant products this is the first variant
  // (kept in sync with the product's top-level fields server-side), so the price
  // shown always matches what's charged.
  const headline = useMemo((): VariantItem => {
    if (hasVariants) return variants![0];
    return { price, mrp: mrp ?? null, stock, unit: unit ?? "" };
  }, [hasVariants, variants, price, mrp, stock, unit]);

  const headThumb = headline.image || thumb;
  const discount  = headline.mrp && headline.mrp > headline.price ? Math.round(((headline.mrp - headline.price) / headline.mrp) * 100) : null;
  const isHot     = discount && discount >= 20;

  // Flat product: a single cart line at variantIdx 0.
  const flatItem  = items.find(i => i.id === id && i.variantIdx === 0);
  const flatQty   = flatItem?.quantity ?? 0;

  // Variant product: total units in cart across all of its variants.
  const variantQty = useMemo(
    () => (hasVariants ? items.filter(i => i.id === id).reduce((n, i) => n + i.quantity, 0) : 0),
    [hasVariants, items, id],
  );

  const anyVariantStock = hasVariants && variants!.some(v => v.stock > 0);
  const outOfStock = hasVariants ? !anyVariantStock : stock === 0;
  const atMax      = !hasVariants && flatQty >= stock;

  const fireFlash = (type: "added" | "inc" | "dec") => {
    setFlash(type);
    setTimeout(() => setFlash("idle"), 500);
  };

  // ── Flat product handlers (variantIdx 0) ──
  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (outOfStock) return;
    addItem({ id, variantIdx: 0, name, price: headline.price, mrp: headline.mrp ?? undefined, unit: headline.unit ?? undefined, image: headThumb });
    fireFlash("added");
  };
  const handleInc = (e: React.MouseEvent) => { e.preventDefault(); if (atMax) return; updateQuantity(id, flatQty + 1, 0); fireFlash("inc"); };
  const handleDec = (e: React.MouseEvent) => {
    e.preventDefault();
    if (flatQty === 1) removeItem(id, 0); else updateQuantity(id, flatQty - 1, 0);
    fireFlash("dec");
  };

  const handleWish = (e: React.MouseEvent) => { e.preventDefault(); toggle(id); };

  const openSheet = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setSheetOpen(true); };

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

  const qtyBadge = hasVariants ? variantQty : flatQty;

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
        {headThumb ? (
          <Image
            src={headThumb}
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

        {/* Low stock badge (flat products only) */}
        {!hasVariants && stock > 0 && stock <= 5 && (
          <div className="absolute bottom-2 left-2 bg-orange-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
            Only {stock} left!
          </div>
        )}

        {/* Qty badge */}
        {qtyBadge > 0 && (
          <div className={cn(
            "absolute top-2 right-2 w-5 h-5 bg-green-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-sm shadow-green-500/40 transition-all duration-200",
            (flash === "inc" || flash === "added") && "scale-125 bg-emerald-500",
            wished && "hidden"
          )}>
            {qtyBadge}
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
          {headline.unit && (
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{headline.unit}</p>
          )}
        </div>
        <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 flex-1">{name}</p>

        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-sm font-extrabold text-gray-900">{formatPrice(headline.price)}</span>
          {headline.mrp && headline.mrp > headline.price && (
            <span className="text-[11px] text-gray-400 line-through">{formatPrice(headline.mrp)}</span>
          )}
        </div>

        {/* Stepper / Add / Notify / Options */}
        <div className="mt-1.5">
          {outOfStock ? (
            <button
              onClick={handleNotify}
              className={cn(
                "w-full h-9 flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-all active:scale-90",
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
          ) : hasVariants ? (
            /* Multi-option product — open the size picker */
            <button
              onClick={openSheet}
              className={cn(
                "w-full h-9 flex flex-col items-center justify-center rounded-xl leading-none transition-all active:scale-90",
                "bg-green-50 border border-green-300 text-green-700",
                "hover:bg-green-500 hover:text-white hover:border-green-500 hover:shadow-md hover:shadow-green-500/25",
              )}
            >
              <span className="flex items-center gap-1 text-sm font-bold"><Plus size={12} strokeWidth={3} /> ADD</span>
              <span className="flex items-center gap-0.5 text-[9px] font-bold opacity-70 mt-0.5">
                {variants!.length} options <ChevronDown size={8} />
              </span>
            </button>
          ) : flatQty === 0 ? (
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
              <span className="text-white text-sm font-extrabold min-w-6 text-center tabular-nums">{flatQty}</span>
              <button onClick={handleInc} disabled={atMax} className="w-6 h-6 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-colors active:scale-90 disabled:opacity-40 disabled:pointer-events-none">
                <Plus size={13} strokeWidth={3} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Variant picker bottom sheet */}
      {hasVariants && sheetOpen && (
        <VariantSheet
          productId={id}
          name={name}
          fallbackImage={thumb}
          variants={variants!}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </Link>
  );
}

// ─── Variant picker sheet (Blinkit/Zepto pattern) ─────────────────────────────
function VariantSheet({
  productId, name, fallbackImage, variants, onClose,
}: {
  productId: number;
  name: string;
  fallbackImage?: string;
  variants: VariantItem[];
  onClose: () => void;
}) {
  // The sheet only ever mounts after a client-side click, so document is always
  // available here — no SSR guard needed.
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const stop = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); };

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex flex-col justify-end sm:items-center sm:justify-center bg-black/40 sm:p-4"
      onClick={(e) => { stop(e); onClose(); }}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[75vh] sm:max-h-[80vh] flex flex-col animate-slide-up sm:shadow-2xl"
        onClick={stop}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
          <h3 className="text-base font-extrabold text-gray-900 leading-snug pr-3 line-clamp-2">{name}</h3>
          <button onClick={(e) => { stop(e); onClose(); }} className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Variant rows */}
        <div className="overflow-y-auto px-4 py-3 space-y-2.5">
          {variants.map((v, idx) => (
            <VariantRow
              key={idx}
              productId={productId}
              name={name}
              variantIdx={idx}
              variant={v}
              fallbackImage={fallbackImage}
            />
          ))}
        </div>
        <div className="h-3" />
      </div>
    </div>,
    document.body,
  );
}

function VariantRow({
  productId, name, variantIdx, variant, fallbackImage,
}: {
  productId: number;
  name: string;
  variantIdx: number;
  variant: VariantItem;
  fallbackImage?: string;
}) {
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const img = variant.image || fallbackImage;
  const cartItem = items.find(i => i.id === productId && i.variantIdx === variantIdx);
  const qty = cartItem?.quantity ?? 0;
  const out = variant.stock === 0;
  const atMax = qty >= variant.stock;
  const discount = variant.mrp && variant.mrp > variant.price ? Math.round(((variant.mrp - variant.price) / variant.mrp) * 100) : null;

  const add = () => addItem({ id: productId, variantIdx, name, price: variant.price, mrp: variant.mrp ?? undefined, unit: variant.unit, image: img });
  const inc = () => { if (!atMax) updateQuantity(productId, qty + 1, variantIdx); };
  const dec = () => { if (qty === 1) removeItem(productId, variantIdx); else updateQuantity(productId, qty - 1, variantIdx); };

  return (
    <div className={cn("flex items-center gap-3 rounded-2xl border p-2.5", out ? "border-gray-100 bg-gray-50/60" : "border-gray-100 bg-white")}>
      {/* Thumb */}
      <div className="relative w-14 h-14 rounded-xl bg-gray-50 overflow-hidden shrink-0 border border-gray-100">
        {img
          ? <Image src={img} alt={variant.unit} fill sizes="56px" className="object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><ShoppingCart size={18} className="text-gray-200" /></div>}
        {discount && !out && (
          <div className="absolute top-0 left-0 bg-blue-600 text-white text-[8px] font-extrabold px-1 py-0.5 rounded-br-md leading-none">
            {discount}%<br />OFF
          </div>
        )}
      </div>

      {/* Size + price */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900">{variant.unit}</p>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-sm font-extrabold text-gray-900">{formatPrice(variant.price)}</span>
          {variant.mrp && variant.mrp > variant.price && (
            <span className="text-[11px] text-gray-400 line-through">{formatPrice(variant.mrp)}</span>
          )}
        </div>
        {!out && variant.stock <= 5 && (
          <p className="text-[10px] font-bold text-orange-600 mt-0.5">Only {variant.stock} left</p>
        )}
      </div>

      {/* Action */}
      <div className="shrink-0">
        {out ? (
          <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-3 py-2 rounded-xl">Out of stock</span>
        ) : qty === 0 ? (
          <button
            onClick={add}
            className="h-9 px-5 flex items-center justify-center gap-1 rounded-xl text-sm font-bold bg-green-50 border border-green-300 text-green-700 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all active:scale-90"
          >
            ADD
          </button>
        ) : (
          <div className="flex items-center justify-between h-9 w-24 bg-linear-to-r from-green-500 to-emerald-500 rounded-xl px-1 shadow-sm shadow-green-500/30">
            <button onClick={dec} className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/20 rounded-lg active:scale-90 transition-colors">
              <Minus size={14} strokeWidth={3} />
            </button>
            <span className="text-white text-sm font-extrabold tabular-nums">{qty}</span>
            <button onClick={inc} disabled={atMax} className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/20 rounded-lg active:scale-90 transition-colors disabled:opacity-40 disabled:pointer-events-none">
              <Plus size={14} strokeWidth={3} />
            </button>
          </div>
        )}
      </div>
    </div>
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
