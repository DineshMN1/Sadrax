"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import {
  LayoutDashboard, Package, Tag, ShoppingBag,
  Settings, Users, Percent, Zap, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Icons live here in the client component — never passed as props from server
const NAV_ITEMS = [
  { href: "/admin",            icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/admin/orders",     icon: ShoppingBag,     label: "Orders" },
  { href: "/admin/products",   icon: Package,         label: "Products" },
  { href: "/admin/categories", icon: Tag,             label: "Categories" },
  { href: "/admin/offers",     icon: Percent,         label: "Offers" },
  { href: "/admin/staff",      icon: Users,           label: "Staff" },
  { href: "/admin/settings",   icon: Settings,        label: "Settings" },
];

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const router  = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/admin/login");
  };

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-100 flex-col fixed top-0 left-0 bottom-0 z-30 hidden md:flex">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
            S
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-none">Sadrax Admin</p>
            <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-30">{email}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "bg-green-50 text-green-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-2 border-t border-gray-100 space-y-1">
        <Link
          href="/cord"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Zap size={16} className="text-orange-500" />
          Open Cord
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
