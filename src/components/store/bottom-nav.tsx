"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid3X3, ShoppingCart, ClipboardList, User } from "lucide-react";
import { useCart } from "@/store/cart";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/",           icon: Home,         label: "Home"    },
  { href: "/categories", icon: Grid3X3,      label: "Shop"    },
  { href: "/cart",       icon: ShoppingCart, label: "Cart"    },
  { href: "/orders",     icon: ClipboardList,label: "Orders"  },
  { href: "/account",    icon: User,         label: "Account" },
];

export function BottomNav() {
  const pathname  = usePathname();
  const itemCount = useCart(s => s.itemCount());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-gray-100/80 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
      <div className="flex max-w-lg mx-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isCart = href === "/cart";
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative group"
            >
              {/* Pill behind active icon */}
              <span className={cn(
                "relative flex items-center justify-center h-7 rounded-2xl transition-all duration-200",
                active ? "bg-green-100 px-3.5" : "px-2",
              )}>
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={cn(
                    "transition-colors duration-150",
                    active ? "text-green-600" : "text-gray-400 group-hover:text-gray-600"
                  )}
                />
                {mounted && isCart && itemCount > 0 && (
                  <span className="absolute -top-1 -right-0.5 min-w-4 h-4 bg-linear-to-br from-green-500 to-emerald-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center px-0.5 shadow-sm shadow-green-500/40">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </span>

              <span className={cn(
                "text-[10px] font-semibold transition-colors duration-150",
                active ? "text-green-600" : "text-gray-400 group-hover:text-gray-600"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
