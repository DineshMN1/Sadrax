"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { signOut } from "@/lib/auth-client";
import {
  LayoutDashboard, Package, Tag, ShoppingBag,
  Settings, Users, Percent, LogOut, TrendingUp, Menu, X, UserRound, GalleryHorizontalEnd, Bell, RotateCcw, Star, ScrollText, Sparkles, Bike, Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PanelSwitcher } from "@/components/panel-switcher";

const NAV_GROUPS = [
  {
    title: null,
    items: [
      { href: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
    ],
  },
  {
    title: "Sales",
    items: [
      { href: "/admin/orders",    icon: ShoppingBag, label: "Orders"    },
      { href: "/admin/returns",   icon: RotateCcw,   label: "Returns"   },
      { href: "/admin/customers", icon: UserRound,   label: "Customers" },
      { href: "/admin/feedback",  icon: Star,        label: "Feedback"  },
      { href: "/admin/analytics", icon: TrendingUp,  label: "Analytics" },
    ],
  },
  {
    title: "Catalog",
    items: [
      { href: "/admin/products",   icon: Package, label: "Products"   },
      { href: "/admin/categories", icon: Tag,     label: "Categories" },
      { href: "/admin/inventory",  icon: Boxes,   label: "Inventory"  },
    ],
  },
  {
    title: "Marketing",
    items: [
      { href: "/admin/promotions",    icon: Sparkles,             label: "Promotions"    },
      { href: "/admin/offers",        icon: Percent,              label: "Coupons"       },
      { href: "/admin/banners",       icon: GalleryHorizontalEnd, label: "Banners"       },
      { href: "/admin/notifications", icon: Bell,                 label: "Notifications" },
    ],
  },
  {
    title: "Team & System",
    items: [
      { href: "/admin/riders",   icon: Bike,       label: "Riders"    },
      { href: "/admin/staff",    icon: Users,      label: "Staff"     },
      { href: "/admin/settings", icon: Settings,   label: "Settings"  },
      { href: "/admin/audit",    icon: ScrollText, label: "Audit Log" },
    ],
  },
];

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);

  // Close drawer whenever the route changes (e.g. programmatic navigation)
  useEffect(() => { setOpen(false); }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    
    // Aggressive storage cleanup for PWA security
    localStorage.clear();
    sessionStorage.clear();
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    if (window.indexedDB && window.indexedDB.databases) {
      try {
        const dbs = await window.indexedDB.databases();
        dbs.forEach(db => { if (db.name) window.indexedDB.deleteDatabase(db.name); });
      } catch (e) { /* Ignore unsupported */ }
    }

    router.replace("/admin/login");
  };

  const allItems = NAV_GROUPS.flatMap(g => g.items);
  const currentPage = allItems.find(item =>
    ("exact" in item && item.exact) ? pathname === item.href : pathname.startsWith(item.href)
  );

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────── */}
      <aside className="w-56 min-h-screen bg-white border-r border-gray-100 flex-col fixed top-0 left-0 bottom-0 z-30 hidden md:flex">
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">A</div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 text-sm leading-none">Admin</p>
                <p className="text-[10px] text-gray-400 mt-0.5 truncate">{email}</p>
              </div>
            </div>
            <PanelSwitcher current="admin" />
          </div>
        </div>

        <nav className="flex-1 py-3 px-3 overflow-y-auto overscroll-contain">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className={gi > 0 ? "mt-4" : ""}>
              {group.title && (
                <p className="px-3 mb-1 text-[10px] font-bold text-gray-300 uppercase tracking-wider">{group.title}</p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const exact = "exact" in item && item.exact;
                  const active = exact ? pathname === item.href : pathname.startsWith(item.href);
                  return (
                    <Link key={item.href} href={item.href} className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      active ? "bg-green-50 text-green-700 font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}>
                      <Icon size={16} strokeWidth={active ? 2.5 : 2} />{item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 pb-4 pt-2 border-t border-gray-100">
          <button onClick={handleSignOut} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile top header ───────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 h-14 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Menu size={18} className="text-gray-700" />
          </button>
          <div>
            <p className="text-sm font-extrabold text-gray-900 leading-none">{currentPage?.label ?? "Admin"}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-40">{email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PanelSwitcher current="admin" />
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">A</div>
        </div>
      </header>

      {/* ── Mobile drawer backdrop ───────────────────────────── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile drawer ───────────────────────────────────── */}
      <div className={`md:hidden fixed top-0 left-0 bottom-0 w-72 bg-white z-50 flex flex-col shadow-2xl will-change-transform transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-sm font-bold">A</div>
            <div>
              <p className="font-extrabold text-gray-900 text-sm">Sadrax Admin</p>
              <p className="text-[10px] text-gray-400 truncate max-w-44">{email}</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
            <X size={16} className="text-gray-600" />
          </button>
        </div>

        {/* Drawer nav */}
        <nav className="flex-1 py-3 px-3 overflow-y-auto overscroll-contain">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className={gi > 0 ? "mt-4" : ""}>
              {group.title && (
                <p className="px-4 mb-1 text-[10px] font-bold text-gray-300 uppercase tracking-wider">{group.title}</p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const exact = "exact" in item && item.exact;
                  const active = exact ? pathname === item.href : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                        active ? "bg-green-50 text-green-700 font-bold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <Icon size={18} strokeWidth={active ? 2.5 : 2} />{item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Drawer footer */}
        <div className="px-3 pb-6 pt-2 border-t border-gray-100">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
