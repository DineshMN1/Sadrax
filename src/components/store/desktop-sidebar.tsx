"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Grid3X3, ShoppingCart, ClipboardList, User, Search
} from "lucide-react";
import { useCart } from "@/store/cart";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/categories", icon: Grid3X3, label: "Categories" },
  { href: "/orders", icon: ClipboardList, label: "Orders" },
  { href: "/account", icon: User, label: "Account" },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const itemCount = useCart((s) => s.itemCount());
  const total = useCart((s) => s.total());

  return (
    <aside className="hidden md:flex flex-col fixed top-0 left-0 bottom-0 w-56 lg:w-64 bg-white border-r border-gray-100 z-30">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center text-white font-black text-lg">S</div>
          <div>
            <p className="font-extrabold text-gray-900 text-sm leading-none">Sadrax</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Sadras Grocery</p>
          </div>
        </div>
      </div>

      {/* Search shortcut */}
      <div className="px-4 py-3 border-b border-gray-100">
        <Link
          href="/search"
          className="flex items-center gap-2.5 h-9 px-3 bg-gray-100 rounded-xl text-sm text-gray-400 hover:bg-gray-200 transition-colors"
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
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "bg-green-50 text-green-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon size={17} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Cart summary (desktop) */}
      {itemCount > 0 && (
        <div className="px-4 pb-5">
          <Link
            href="/cart"
            className="flex items-center justify-between bg-green-600 text-white px-4 py-3 rounded-2xl shadow-md shadow-green-600/20 hover:bg-green-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} />
              <span className="text-sm font-bold">{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
            </div>
            <span className="text-sm font-bold">{formatPrice(total)} →</span>
          </Link>
        </div>
      )}
    </aside>
  );
}
