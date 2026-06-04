"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Heart, ShoppingBag, Trash2 } from "lucide-react";
import { useWishlist } from "@/store/wishlist";
import { ProductCard, ProductCardSkeleton } from "@/components/store/product-card";

interface Product {
  id: number;
  name: string;
  price: number;
  mrp: number | null;
  unit: string | null;
  images: string[] | null;
  stock: number;
}

export default function WishlistPage() {
  const router  = useRouter();
  const { ids, clear } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (ids.length === 0) { setProducts([]); return; }
    setLoading(true);
    fetch(`/api/products?ids=${ids.join(",")}`)
      .then(r => r.json())
      .then(data => setProducts(data.products ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [ids.join(",")]);

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-20 glass border-b border-gray-100/80 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
          <ChevronLeft size={20} className="text-gray-700" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <Heart size={18} className="text-red-500 fill-red-500" />
          <h1 className="text-lg font-extrabold text-gray-900">Wishlist</h1>
          {ids.length > 0 && (
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {ids.length}
            </span>
          )}
        </div>
        {ids.length > 0 && (
          <button onClick={clear} className="flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-600 transition-colors">
            <Trash2 size={13} /> Clear all
          </button>
        )}
      </div>

      <div className="px-4 py-4">
        {/* Empty state */}
        {!loading && ids.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-5">
              <Heart size={36} className="text-red-300" />
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">No items saved</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-xs">
              Tap the heart on any product to save it here for later
            </p>
            <Link
              href="/"
              className="flex items-center gap-2 bg-linear-to-r from-green-600 to-emerald-600 text-white px-7 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-green-600/30"
            >
              <ShoppingBag size={16} /> Browse Products
            </Link>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-2 gap-3">
            {Array(ids.length || 4).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        )}

        {/* Product grid */}
        {!loading && products.length > 0 && (
          <>
            <p className="text-xs text-gray-400 font-medium mb-3">
              {products.length} saved item{products.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {products.map(p => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  price={p.price}
                  mrp={p.mrp}
                  unit={p.unit}
                  images={p.images as string[]}
                  stock={p.stock}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
