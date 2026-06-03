import Link from "next/link";
import Image from "next/image";
import { MapPin, Bell, ChevronRight, Zap } from "lucide-react";
import { Suspense } from "react";
import { SearchBar } from "@/components/store/search-bar";
import { ProductCard, ProductCardSkeleton } from "@/components/store/product-card";
import { StoreClosedBanner } from "@/components/store/store-closed-banner";
import { db } from "@/lib/db";
import { products, categories, storeSettings } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

async function getHomeData() {
  const [cats, featured, topOrdered, settings] = await Promise.all([
    db.select().from(categories).where(eq(categories.active, true)).orderBy(categories.order).limit(16),
    db.select().from(products).where(and(eq(products.active, true), eq(products.featured, true))).limit(8),
    db.select().from(products).where(eq(products.active, true)).orderBy(desc(products.orderCount)).limit(10),
    db.select().from(storeSettings).where(eq(storeSettings.key, "store_open")),
  ]);
  return { cats, featured, topOrdered, isOpen: settings[0]?.value !== "false" };
}

export default async function HomePage() {
  const { cats, featured, topOrdered, isOpen } = await getHomeData();

  return (
    <div className="flex flex-col">
      {/* ── Mobile header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 pt-4 pb-3 space-y-3 md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm font-bold text-gray-900">Sadras</span>
            <span className="text-xs text-gray-400">603102</span>
            <MapPin size={12} className="text-gray-400 -ml-0.5" />
          </div>
          <button className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors relative">
            <Bell size={17} className="text-gray-600" />
          </button>
        </div>
        <Suspense><SearchBar /></Suspense>
      </div>

      {/* ── Desktop header ────────────────────────────────────────────────── */}
      <div className="hidden md:flex sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 px-6 py-3.5 items-center gap-4">
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-bold text-gray-900">Delivering to Sadras, 603102</span>
        </div>
        <Suspense><SearchBar className="flex-1 max-w-lg" /></Suspense>
        <button className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 shrink-0">
          <Bell size={17} className="text-gray-600" />
        </button>
      </div>

      <div className="px-4 md:px-6 py-4 space-y-7">
        {!isOpen && <StoreClosedBanner />}

        {/* ── Hero banner ───────────────────────────────────────────────── */}
        <div className="relative bg-linear-to-br from-green-600 via-green-700 to-emerald-800 rounded-3xl p-5 overflow-hidden min-h-[120px] flex items-center">
          {/* Decorative circles */}
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -right-4 -bottom-10 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute right-14 top-3 w-10 h-10 bg-white/10 rounded-full" />

          <div className="relative z-10 flex-1">
            <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-full mb-2.5">
              <Zap size={10} fill="white" />
              Fast local delivery
            </div>
            <h2 className="text-white text-xl font-extrabold leading-tight mb-1">
              Sadras ki<br />apni grocery
            </h2>
            <p className="text-green-200 text-xs mb-3">Fresh, local, delivered fast.</p>
            <Link
              href="/categories"
              className="inline-flex items-center gap-1 bg-white text-green-700 text-xs font-extrabold px-3.5 py-2 rounded-xl hover:bg-green-50 transition-colors"
            >
              Shop Now <ChevronRight size={12} strokeWidth={3} />
            </Link>
          </div>
          <div className="relative z-10 text-5xl ml-4 drop-shadow-sm select-none">🛒</div>
        </div>

        {/* ── Categories ────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-gray-900">Shop by Category</h2>
            <Link href="/categories" className="flex items-center gap-0.5 text-xs font-bold text-green-600 hover:text-green-700">
              See all <ChevronRight size={13} strokeWidth={3} />
            </Link>
          </div>

          {cats.length === 0 ? (
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 p-2 bg-white rounded-2xl border border-gray-100 animate-pulse">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                  <div className="h-2 w-8 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {cats.map(cat => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="flex flex-col items-center gap-1.5 p-2 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-green-200 hover:shadow-md active:scale-95 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-50 shrink-0 flex items-center justify-center">
                    {cat.image
                      ? <Image src={cat.image} alt={cat.name} width={40} height={40} className="w-full h-full object-cover" />
                      : <span className="text-xl">🛒</span>}
                  </div>
                  <span className="text-[10px] font-semibold text-gray-700 text-center leading-tight line-clamp-2">{cat.name}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Deals for you ─────────────────────────────────────────────── */}
        {featured.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-gray-900">Deals for you</h2>
                <span className="text-[10px] font-extrabold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                  Limited time
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {featured.map(p => (
                <ProductCard key={p.id} id={p.id} name={p.name} price={p.price} mrp={p.mrp} unit={p.unit} images={p.images as string[]} stock={p.stock} />
              ))}
            </div>
          </section>
        )}

        {/* ── Most Ordered ──────────────────────────────────────────────── */}
        {topOrdered.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-gray-900">Most Ordered</h2>
                <span className="text-[10px] text-gray-400 font-medium">by your neighbours</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {topOrdered.map(p => (
                <ProductCard key={p.id} id={p.id} name={p.name} price={p.price} mrp={p.mrp} unit={p.unit} images={p.images as string[]} stock={p.stock} />
              ))}
            </div>
          </section>
        )}

        {/* ── Empty state ───────────────────────────────────────────────── */}
        {topOrdered.length === 0 && featured.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-4 text-4xl">🛒</div>
            <h3 className="font-bold text-gray-800">Store is being stocked up</h3>
            <p className="text-sm text-gray-400 mt-1.5 max-w-xs">Products will appear here soon. Check back in a bit!</p>
          </div>
        )}

        {/* Bottom padding for mobile nav */}
        <div className="h-2" />
      </div>
    </div>
  );
}
