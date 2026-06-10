"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grid3X3, Tag, ClipboardList, User, ShoppingCart, MapPin, Zap } from "lucide-react";
import { Suspense, useSyncExternalStore } from "react";
import { useCart } from "@/store/cart";
import { useStoreConfig } from "@/store/config";
import { useSession } from "@/lib/auth-client";
import { cn, formatPrice } from "@/lib/utils";
import { SearchBar } from "@/components/store/search-bar";

const navItems = [
  { href: "/categories", icon: Grid3X3,       label: "Categories" },
  { href: "/offers",     icon: Tag,           label: "Offers"     },
  { href: "/orders",     icon: ClipboardList, label: "Orders"     },
];

// Blinkit/Zepto-style top header — desktop only. Replaces the left sidebar.
export function DesktopHeader() {
  const pathname  = usePathname();
  const pincodes  = useStoreConfig(s => s.pincodes);
  const eta       = useStoreConfig(s => s.deliveryEta);
  const itemCount = useCart(s => s.itemCount());
  const total     = useCart(s => s.total());
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0];
  // Hydration-safe client flag — cart count/total come from a persisted store,
  // so they're only correct after hydration. Avoids SSR mismatch without
  // calling setState in an effect.
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  return (
    <header className="hidden md:block sticky top-0 z-40 h-16 bg-white border-b border-gray-100">
      <div className="max-w-360 mx-auto h-full flex items-center gap-4 px-6 lg:px-8">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2.5 shrink-0">
        <div className="w-9 h-9 bg-linear-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-base shadow-sm shadow-green-500/30">
          S
        </div>
        <div className="hidden lg:block">
          <p className="font-extrabold text-gray-900 text-sm leading-none">Sadrax</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Zap size={9} className="text-green-500" fill="currentColor" />
            <p className="text-[10px] text-green-600 font-semibold leading-none">{eta}</p>
          </div>
        </div>
      </Link>

      {/* Location */}
      <div className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100">
        <MapPin size={14} className="text-green-600 shrink-0" />
        <div className="leading-none">
          <p className="text-[10px] text-gray-400 font-semibold">Only in Sadras</p>
          <p className="text-xs font-bold text-gray-900 mt-0.5">{pincodes[0] ?? "603102"}</p>
        </div>
      </div>

      {/* Search */}
      <Suspense>
        <SearchBar className="flex-1 max-w-2xl" />
      </Suspense>

      {/* Nav */}
      <nav className="flex items-center gap-1 shrink-0">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                active ? "bg-green-50 text-green-700 font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 2} />
              <span className="hidden lg:inline">{label}</span>
            </Link>
          );
        })}

        {/* Account */}
        <Link
          href="/account"
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
            pathname.startsWith("/account") ? "bg-green-50 text-green-700 font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
          )}
        >
          <User size={16} strokeWidth={pathname.startsWith("/account") ? 2.5 : 2} />
          <span className="hidden lg:inline max-w-24 truncate">{mounted && firstName ? firstName : "Account"}</span>
        </Link>
      </nav>

      {/* Cart */}
      <Link
        href="/cart"
        className="flex items-center gap-2 shrink-0 h-10 px-3.5 rounded-xl bg-linear-to-r from-green-600 to-emerald-600 text-white shadow-sm shadow-green-600/20 hover:shadow-md hover:shadow-green-600/30 transition-all"
      >
        <div className="relative">
          <ShoppingCart size={17} />
          {mounted && itemCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-3.5 h-3.5 px-0.5 bg-white text-green-600 text-[8px] font-extrabold rounded-full flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </div>
        <span className="text-sm font-bold tabular-nums">
          {mounted && itemCount > 0 ? formatPrice(total) : "Cart"}
        </span>
      </Link>
      </div>
    </header>
  );
}
