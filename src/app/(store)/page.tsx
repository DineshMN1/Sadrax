import Link from "next/link";
import Image from "next/image";
import { MapPin, Bell } from "lucide-react";
import { SearchBar } from "@/components/store/search-bar";
import { ProductCard, ProductCardSkeleton } from "@/components/store/product-card";
import { StoreClosedBanner } from "@/components/store/store-closed-banner";
import { db } from "@/lib/db";
import { products, categories, storeSettings } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { Suspense } from "react";

async function getHomeData() {
  const [cats, featured, topOrdered, settings] = await Promise.all([
    db.select().from(categories).where(eq(categories.active, true)).orderBy(categories.order).limit(16),
    db.select().from(products).where(and(eq(products.active, true), eq(products.featured, true))).limit(8),
    db.select().from(products).where(eq(products.active, true)).orderBy(desc(products.orderCount)).limit(10),
    db.select().from(storeSettings).where(eq(storeSettings.key, "store_open")),
  ]);
  const isOpen = settings[0]?.value !== "false";
  return { cats, featured, topOrdered, isOpen };
}

export default async function HomePage() {
  const { cats, featured, topOrdered, isOpen } = await getHomeData();

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 pt-4 pb-3 space-y-3 md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm">
            <MapPin size={14} className="text-green-600" />
            <span className="font-bold text-gray-900">Sadras</span>
            <span className="text-gray-400 text-xs">603102</span>
          </div>
          <button className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100">
            <Bell size={18} className="text-gray-600" />
          </button>
        </div>
        <Suspense><SearchBar /></Suspense>
      </div>

      {/* Desktop header bar */}
      <div className="hidden md:flex sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-4 items-center gap-4">
        <div className="flex items-center gap-1.5 text-sm shrink-0">
          <MapPin size={14} className="text-green-600" />
          <span className="font-bold text-gray-900">Sadras, 603102</span>
        </div>
        <Suspense><SearchBar className="flex-1 max-w-md" /></Suspense>
        <button className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 shrink-0">
          <Bell size={18} className="text-gray-600" />
        </button>
      </div>

      <div className="px-4 md:px-6 py-4 space-y-8">
        {!isOpen && <StoreClosedBanner />}

        {/* Hero banner – shown only when there are featured items */}
        {featured.length > 0 && (
          <div className="bg-linear-to-br from-green-600 to-emerald-700 rounded-3xl p-5 flex items-center justify-between overflow-hidden relative">
            <div className="relative z-10">
              <p className="text-green-200 text-xs font-semibold uppercase tracking-wide mb-1">Deals today</p>
              <h2 className="text-white text-2xl font-extrabold leading-tight">Fresh picks,<br />fresh prices</h2>
              <Link href="/categories" className="inline-flex mt-3 bg-white text-green-700 text-xs font-bold px-4 py-2 rounded-xl">
                Shop Deals →
              </Link>
            </div>
            <div className="text-6xl opacity-90 relative z-10">🥦</div>
            {/* decorative circles */}
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
            <div className="absolute -right-4 -bottom-8 w-24 h-24 bg-white/10 rounded-full" />
          </div>
        )}

        {/* Categories grid */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">Shop by Category</h2>
            <Link href="/categories" className="text-xs text-green-600 font-semibold">See all</Link>
          </div>
          {cats.length === 0 ? (
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-white border border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse" />
                  <div className="h-2 w-8 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {cats.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-green-200 hover:shadow-md transition-all"
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                    {cat.image ? (
                      <Image src={cat.image} alt={cat.name} width={40} height={40} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-green-50 flex items-center justify-center text-xl">🛒</div>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-gray-700 text-center leading-tight">{cat.name}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Featured products */}
        {featured.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900">Deals for you</h2>
              <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">Limited time</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {featured.map((p) => (
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
          </section>
        )}

        {/* Most ordered */}
        {topOrdered.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900">Most Ordered</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {topOrdered.map((p) => (
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
          </section>
        )}

        {topOrdered.length === 0 && featured.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="text-5xl mb-4">🛒</span>
            <h3 className="font-semibold text-gray-700">Store is being stocked up</h3>
            <p className="text-sm text-gray-400 mt-1">Products will appear here soon. Check back!</p>
          </div>
        )}
      </div>
    </div>
  );
}
