export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { MapPin, ChevronRight, Zap, Sparkles, TrendingUp } from "lucide-react";
import { Suspense } from "react";
import { SearchBar } from "@/components/store/search-bar";
import { ProductCard } from "@/components/store/product-card";
import { StoreClosedBanner } from "@/components/store/store-closed-banner";
import { LocationBanner } from "@/components/store/location-banner";
import { GreetingHeader } from "@/components/store/greeting-header";
import { RecentlyViewedSection } from "@/components/store/recently-viewed-section";
import { BuyAgainSection } from "@/components/store/buy-again-section";
import { BannerCarousel } from "@/components/store/banner-carousel";
import { getCategoryEmoji } from "@/lib/category-emoji";
import { db } from "@/lib/db";
import { products, categories, storeSettings, banners } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

async function getHomeData() {
  const [cats, featured, topOrdered, allProducts, settings, promoBanners] = await Promise.all([
    db.select().from(categories).where(eq(categories.active, true)).orderBy(categories.order).limit(16),
    db.select().from(products).where(and(eq(products.active, true), eq(products.featured, true))).limit(8),
    db.select().from(products).where(eq(products.active, true)).orderBy(desc(products.orderCount)).limit(10),
    db.select().from(products).where(eq(products.active, true)).orderBy(products.name).limit(40),
    db.select().from(storeSettings).where(eq(storeSettings.key, "store_open")),
    db.select().from(banners).where(eq(banners.active, true)).orderBy(banners.order, banners.id).limit(5),
  ]);
  return { cats, featured, topOrdered, allProducts, isOpen: settings[0]?.value !== "false", promoBanners };
}

export default async function HomePage() {
  const { cats, featured, topOrdered, allProducts, isOpen, promoBanners } = await getHomeData();

  return (
    <div className="flex flex-col">
      {/* ── Mobile header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 glass border-b border-gray-100/80 px-4 pt-4 pb-3 space-y-3 md:hidden">
        <Suspense fallback={
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold text-gray-900">Sadras</span>
          </div>
        }>
          <GreetingHeader />
        </Suspense>
        <Suspense><SearchBar /></Suspense>
      </div>

      {/* ── Desktop header ────────────────────────────────────────────────── */}
      <div className="hidden md:flex sticky top-0 z-20 glass border-b border-gray-100/80 px-6 py-3.5 items-center gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative w-2.5 h-2.5">
            <span className="absolute inset-0 bg-green-500 rounded-full animate-pulse-ring" />
            <span className="absolute inset-0 bg-green-500 rounded-full" />
          </div>
          <span className="text-sm font-bold text-gray-900">Delivering to Sadras, 603102</span>
        </div>
        <Suspense><SearchBar className="flex-1 max-w-lg" /></Suspense>
        <Suspense fallback={null}><GreetingHeader /></Suspense>
      </div>

      {/* Location banner — client component, outside px padding */}
      <LocationBanner />

      <div className="px-4 md:px-6 py-4 space-y-7">
        {!isOpen && <StoreClosedBanner />}

        {/* ── Hero banner(s) ────────────────────────────────────────────── */}
        {promoBanners.length > 0 ? (
          <BannerCarousel banners={promoBanners} />
        ) : (
          <div className="relative bg-linear-to-br from-green-600 via-green-700 to-emerald-800 rounded-3xl p-5 overflow-hidden min-h-32.5 flex items-center shadow-xl shadow-green-700/20">
            <div className="absolute -right-8 -top-8 w-44 h-44 bg-white/10 rounded-full blur-sm" />
            <div className="absolute -right-2 -bottom-12 w-32 h-32 bg-white/10 rounded-full" />
            <div className="absolute right-16 top-4 w-12 h-12 bg-white/10 rounded-full" />
            <div className="relative z-10 flex-1">
              <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-full mb-2.5 backdrop-blur-sm border border-white/10">
                <Zap size={10} fill="white" />
                10-min local delivery
              </div>
              <h2 className="text-white text-xl font-extrabold leading-tight mb-1">
                நம்ம Sadras-ல<br />கிரசரி 🛒
              </h2>
              <p className="text-green-200 text-xs mb-3.5">புதுசா. நம்ம ஊரு. வேகமா டெலிவரி.</p>
              <Link
                href="/categories"
                className="inline-flex items-center gap-1.5 bg-white text-green-700 text-xs font-extrabold px-4 py-2 rounded-xl hover:bg-green-50 transition-colors shadow-sm"
              >
                Shop Now <ChevronRight size={12} strokeWidth={3} />
              </Link>
            </div>
          </div>
        )}

        {/* ── Categories ────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-gray-900">Shop by Category</h2>
            <Link href="/categories" className="flex items-center gap-0.5 text-xs font-bold text-green-600 hover:text-green-700 transition-colors">
              See all <ChevronRight size={13} strokeWidth={3} />
            </Link>
          </div>
          {cats.length === 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-2.5">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-gray-100">
                  <div className="w-16 h-16 skeleton rounded-2xl" />
                  <div className="h-2.5 w-12 skeleton rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-2.5">
              {cats.map(cat => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="basis-[calc((100%-1.25rem)/3)] sm:basis-[calc((100%-2.5rem)/5)] md:basis-[calc((100%-4.375rem)/8)] flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-green-200 hover:shadow-md active:scale-95 transition-all group"
                >
                  <div className="w-16 h-16 md:w-14 md:h-14 rounded-2xl overflow-hidden bg-gray-50 shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {cat.image
                      ? <Image src={cat.image} alt={cat.name} width={64} height={64} className="w-full h-full object-cover" />
                      : <span className="text-3xl">{getCategoryEmoji(cat.slug)}</span>}
                  </div>
                  <span className="text-[11px] font-semibold text-gray-700 text-center leading-tight line-clamp-2">{cat.name}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Buy Again (client — from order history) ───────────────────── */}
        <BuyAgainSection />

        {/* ── Deals for you ─────────────────────────────────────────────── */}
        {featured.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-gray-900">Deals for you</h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                  <Sparkles size={9} /> Limited time
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
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  <TrendingUp size={9} /> Popular
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {topOrdered.map(p => (
                <ProductCard key={p.id} id={p.id} name={p.name} price={p.price} mrp={p.mrp} unit={p.unit} images={p.images as string[]} stock={p.stock} />
              ))}
            </div>
          </section>
        )}

        {/* ── Recently Viewed (client) ───────────────────────────────────── */}
        <RecentlyViewedSection />

        {/* ── All Products ──────────────────────────────────────────────── */}
        {allProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-extrabold text-gray-900">All Products</h2>
              <Link href="/categories" className="flex items-center gap-0.5 text-xs font-bold text-green-600 hover:text-green-700 transition-colors">
                Browse all <ChevronRight size={13} strokeWidth={3} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {allProducts.map(p => (
                <ProductCard key={p.id} id={p.id} name={p.name} price={p.price} mrp={p.mrp} unit={p.unit} images={p.images as string[]} stock={p.stock} />
              ))}
            </div>
          </section>
        )}

        {allProducts.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-20 h-20 bg-linear-to-br from-green-100 to-emerald-100 rounded-3xl flex items-center justify-center mb-4 text-4xl shadow-sm">
              🛒
            </div>
            <h3 className="font-bold text-gray-800">Store is being stocked up</h3>
            <p className="text-sm text-gray-400 mt-1.5 max-w-xs">Products will appear here soon. Check back in a bit!</p>
          </div>
        )}

        <div className="h-2" />
      </div>
    </div>
  );
}
