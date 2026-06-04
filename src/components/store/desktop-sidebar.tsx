"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid3X3, ShoppingCart, ClipboardList, User, Search, Phone, Zap, Tag } from "lucide-react";
import { useCart } from "@/store/cart";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { PWAInstallButton } from "@/components/store/pwa-install-banner";
import { useEffect, useState } from "react";

const STORE_PHONE = process.env.NEXT_PUBLIC_STORE_PHONE ?? "9876543210";

const navItems = [
  { href: "/",           icon: Home,         label: "Home"       },
  { href: "/categories", icon: Grid3X3,      label: "Categories" },
  { href: "/offers",     icon: Tag,          label: "Offers"     },
  { href: "/orders",     icon: ClipboardList,label: "Orders"     },
  { href: "/account",    icon: User,         label: "Account"    },
];

export function DesktopSidebar() {
  const pathname  = usePathname();
  const itemCount = useCart(s => s.itemCount());
  const total     = useCart(s => s.total());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <aside className="hidden md:flex flex-col fixed top-0 left-0 bottom-0 w-56 lg:w-64 bg-white border-r border-gray-100 z-30">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-linear-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm shadow-green-500/30">
            S
          </div>
          <div>
            <p className="font-extrabold text-gray-900 text-sm leading-none">Sadrax</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Zap size={10} className="text-green-500" fill="currentColor" />
              <p className="text-[10px] text-green-600 font-semibold">Fast delivery</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search shortcut */}
      <div className="px-4 py-3 border-b border-gray-100">
        <Link
          href="/search"
          className="flex items-center gap-2.5 h-10 px-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-400 hover:bg-gray-100 hover:border-gray-200 transition-all"
        >
          <Search size={15} />
          <span>Search groceries…</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-3 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-linear-to-r from-green-50 to-emerald-50 text-green-700 font-semibold border border-green-100"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon size={17} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Cart summary — mounted guard prevents SSR/client mismatch */}
      {mounted && itemCount > 0 && (
        <div className="px-4 pb-3">
          <Link
            href="/cart"
            className="flex items-center justify-between bg-linear-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-2xl shadow-md shadow-green-600/20 hover:shadow-lg hover:shadow-green-600/30 transition-all"
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <ShoppingCart size={16} />
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white text-green-600 text-[8px] font-extrabold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              </div>
              <span className="text-sm font-bold">{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
            </div>
            <span className="text-sm font-extrabold">{formatPrice(total)} →</span>
          </Link>
        </div>
      )}

      {/* PWA install */}
      <div className="px-4 pb-2">
        <PWAInstallButton className="w-full justify-center" />
      </div>

      {/* Call Store */}
      <div className="px-4 pb-5">
        <a
          href={`tel:+91${STORE_PHONE.replace(/\D/g, "")}`}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 bg-green-50 border border-green-100 rounded-xl hover:bg-green-100 hover:border-green-200 transition-all group"
        >
          <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center shrink-0">
            <Phone size={13} className="text-white" fill="white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-green-800 leading-none">Call Store</p>
            <p className="text-[10px] text-green-600 mt-0.5 truncate">+91 {STORE_PHONE}</p>
          </div>
        </a>
      </div>
    </aside>
  );
}
