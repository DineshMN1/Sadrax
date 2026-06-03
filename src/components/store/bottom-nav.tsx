"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid3X3, ShoppingCart, ClipboardList, User } from "lucide-react";
import { useCart } from "@/store/cart";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/",           icon: Home,         label: "Home"       },
  { href: "/categories", icon: Grid3X3,      label: "Shop"       },
  { href: "/cart",       icon: ShoppingCart, label: "Cart"       },
  { href: "/orders",     icon: ClipboardList,label: "Orders"     },
  { href: "/account",    icon: User,         label: "Account"    },
];

export function BottomNav() {
  const pathname = usePathname();
  const itemCount = useCart(s => s.itemCount());

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 pb-safe shadow-[0_-1px_0_0_rgba(0,0,0,0.06)]">
      <div className="flex max-w-lg mx-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isCart  = href === "/cart";
          const active  = pathname === href || (href !== "/" && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center pt-2 pb-1.5 gap-0.5 relative group"
            >
              {/* Active indicator pill */}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-green-500 rounded-full" />
              )}

              <span className="relative">
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={cn(
                    "transition-colors duration-150",
                    active ? "text-green-600" : "text-gray-400 group-hover:text-gray-600"
                  )}
                />
                {isCart && itemCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 bg-green-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center px-0.5 shadow-sm">
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
