"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export function ProductBackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
    >
      <ChevronLeft size={20} className="text-gray-700" />
    </button>
  );
}
import Image from "next/image";
import Link from "next/link";
import { Plus, Minus, ShoppingCart, Heart, Flame, ChevronLeft, ChevronRight, Share2, Check, Bell, Loader2 } from "lucide-react";
import { useCart } from "@/store/cart";
import { track } from "@/lib/analytics";
import { useWishlist } from "@/store/wishlist";
import { useRecentlyViewed, type RecentProduct } from "@/store/recently-viewed";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Category { id: number; name: string; slug: string }

interface Props {
  id: number;
  name: string;
  price: number;
  mrp?: number | null;
  unit?: string | null;
  stock: number;
  images: string[];
  description?: string | null;
  discount: number | null;
  category: Category | null;
}

export function ProductDetailClient({ id, name, price, mrp, unit, stock, images, description, discount, category }: Props) {
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const { toggle, has }   = useWishlist();
  const { add: addRecent } = useRecentlyViewed();

  const cartItem = items.find(i => i.id === id);
  const qty      = cartItem?.quantity ?? 0;
  const cartCount = items.reduce((n, i) => n + i.quantity, 0);
  const cartTotal = useCart(s => s.total());
  const wished   = has(id);
  const [imgIdx, setImgIdx] = useState(0);
  const [flash, setFlash]   = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [notified, setNotified]   = useState(false);

  const notifyMe = async () => {
    setNotifying(true);
    try {
      const res = await fetch("/api/stock-alert", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id }),
      });
      if (res.status === 401) { toast.error("Please log in to get notified"); return; }
      if (!res.ok) { toast.error("Couldn't set the alert"); return; }
      setNotified(true);
      toast.success("We'll notify you when it's back!");
    } finally {
      setNotifying(false);
    }
  };

  // Track as recently viewed on mount
  useEffect(() => {
    const p: RecentProduct = { id, name, price, mrp, unit, images, stock };
    addRecent(p);
    track("product_viewed", { product_id: id, name, price: price / 100, category: category?.name });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAdd = () => {
    if (stock === 0) return;
    addItem({ id, name, price, mrp: mrp ?? undefined, unit: unit ?? undefined, image: images[0] });
    setFlash(true);
    setTimeout(() => setFlash(false), 600);
  };

  const isHot = discount && discount >= 20;

  /* Touch swipe */
  const touchStart = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (touchStart.current === null || images.length <= 1) return;
    const delta = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 40) {
      setImgIdx(i => delta > 0 ? Math.min(i + 1, images.length - 1) : Math.max(i - 1, 0));
    }
    touchStart.current = null;
  };

  return (
    <>
      {/* Image carousel */}
      <div className="relative bg-gray-50 select-none" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="aspect-square md:aspect-4/3 lg:aspect-video max-h-105 overflow-hidden relative">
          {images.length > 0 ? (
            <Image
              src={images[imgIdx]}
              alt={name}
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              className={cn("object-contain transition-opacity duration-200", flash && "opacity-80")}
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ShoppingCart size={48} className="text-gray-200" />
            </div>
          )}

          {/* Discount badge */}
          {discount && stock > 0 && (
            <div className={cn(
              "absolute top-3 left-3 flex items-center gap-1 text-white text-xs font-extrabold px-2.5 py-1 rounded-full shadow-sm",
              isHot ? "bg-linear-to-r from-orange-500 to-red-500" : "bg-linear-to-r from-green-500 to-emerald-500"
            )}>
              {isHot && <Flame size={10} fill="white" />}
              {discount}% OFF
            </div>
          )}

          {/* Wishlist */}
          <button
            onClick={() => { toggle(id); toast(wished ? "Removed from wishlist" : "Added to wishlist"); }}
            className={cn(
              "absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all",
              wished ? "bg-red-500" : "bg-white/90 backdrop-blur-sm"
            )}
          >
            <Heart size={17} className={cn(wished ? "text-white fill-white" : "text-gray-400")} />
          </button>

          {/* Out of stock */}
          {stock === 0 && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="text-sm font-bold text-gray-500 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                Out of stock
              </span>
            </div>
          )}

          {/* Arrows */}
          {images.length > 1 && (
            <>
              <button onClick={() => setImgIdx(i => Math.max(i - 1, 0))} disabled={imgIdx === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center disabled:opacity-30 shadow-sm">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setImgIdx(i => Math.min(i + 1, images.length - 1))} disabled={imgIdx === images.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center disabled:opacity-30 shadow-sm">
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>

        {/* Dot indicators */}
        {images.length > 1 && (
          <div className="flex justify-center gap-1.5 py-3 bg-white">
            {images.map((_, i) => (
              <button key={i} onClick={() => setImgIdx(i)}
                className={cn("rounded-full transition-all", i === imgIdx ? "w-4 h-2 bg-green-500" : "w-2 h-2 bg-gray-200")} />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-white px-4 pt-4 pb-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {unit && <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{unit}</p>}
            <h1 className="text-xl font-extrabold text-gray-900 leading-tight">{name}</h1>
          </div>
          {/* Share button */}
          <ShareButton name={name} price={price} id={id} />
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-black text-gray-900">{formatPrice(price)}</span>
          {mrp && mrp > price && (
            <>
              <span className="text-base text-gray-400 line-through">{formatPrice(mrp)}</span>
              <span className="text-sm font-bold text-green-600">{discount}% off</span>
            </>
          )}
        </div>

        {/* Add to cart control */}
        <div className="pt-1">
          {stock === 0 ? (
            <button
              onClick={notifyMe}
              disabled={notifying || notified}
              className="w-full h-13 flex items-center justify-center gap-2 bg-gray-900 text-white font-bold text-base rounded-2xl active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {notifying ? <Loader2 size={18} className="animate-spin" /> : <Bell size={17} />}
              {notified ? "We'll notify you" : "Notify me when back in stock"}
            </button>
          ) : qty === 0 ? (
            <button
              onClick={handleAdd}
              className="w-full h-13 flex items-center justify-center gap-2 bg-linear-to-r from-green-600 to-emerald-600 text-white font-bold text-base rounded-2xl shadow-lg shadow-green-600/30 active:scale-[0.98] transition-all hover:shadow-xl"
            >
              <Plus size={18} strokeWidth={3} />
              Add to Cart
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 h-13 bg-linear-to-r from-green-500 to-emerald-500 rounded-2xl px-4 shadow-lg shadow-green-500/30">
                <button onClick={() => qty === 1 ? removeItem(id) : updateQuantity(id, qty - 1)}
                  className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white active:scale-90 transition-all">
                  <Minus size={16} strokeWidth={3} />
                </button>
                <span className="text-white text-lg font-extrabold min-w-8 text-center tabular-nums">{qty}</span>
                <button onClick={() => { if (qty < stock) updateQuantity(id, qty + 1); }}
                  disabled={qty >= stock}
                  className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white active:scale-90 transition-all disabled:opacity-40 disabled:pointer-events-none">
                  <Plus size={16} strokeWidth={3} />
                </button>
              </div>
              <span className="text-sm font-semibold text-gray-500">{qty} in cart</span>
            </div>
          )}
        </div>

        {/* Stock indicator — stays on the product, no toast */}
        {stock > 0 && qty >= stock ? (
          <p className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 w-fit">
            That&apos;s all {stock} we have in stock
          </p>
        ) : stock > 0 && stock <= 10 ? (
          <p className="text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100 w-fit">
            Only {stock} left!
          </p>
        ) : null}

        {/* View Cart — inline (product page hides the global floating bar) */}
        {cartCount > 0 && (
          <Link
            href="/cart"
            className="w-full h-12 flex items-center justify-between bg-green-50 border border-green-200 rounded-2xl px-4 active:scale-[0.98] transition-all"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-green-700">
              <ShoppingCart size={16} /> View Cart · {cartCount} item{cartCount > 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-2 text-sm font-extrabold text-green-700">
              {formatPrice(cartTotal)} <ChevronRight size={16} />
            </span>
          </Link>
        )}
      </div>

      {/* Description */}
      {description && (
        <div className="bg-white mt-2 px-4 py-4 space-y-2">
          <h2 className="text-sm font-extrabold text-gray-900">About this product</h2>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{description}</p>
        </div>
      )}
    </>
  );
}

function ShareButton({ name, price, id }: { name: string; price: number; id: number }) {
  const [shared, setShared] = useState(false);

  const handleShare = useCallback(async () => {
    const url  = `${window.location.origin}/product/${id}`;
    const text = `${name} — ${(price / 100).toFixed(0)}₹ on Sadrax`;
    if (navigator.share) {
      try { await navigator.share({ title: name, text, url }); } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }, [name, price, id]);

  return (
    <button
      onClick={handleShare}
      className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
    >
      {shared ? <Check size={16} className="text-green-600" /> : <Share2 size={16} className="text-gray-600" />}
    </button>
  );
}
