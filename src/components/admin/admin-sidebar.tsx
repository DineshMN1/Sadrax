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

const NAV_ITEMS = [
  { href: "/admin",            icon: LayoutDashboard, label: "Dashboard",  exact: true },
  { href: "/admin/orders",     icon: ShoppingBag,     label: "Orders"               },
  { href: "/admin/returns",    icon: RotateCcw,       label: "Returns"              },
  { href: "/admin/customers",  icon: UserRound,       label: "Customers"            },
  { href: "/admin/products",   icon: Package,         label: "Products"             },
  { href: "/admin/categories", icon: Tag,             label: "Categories"           },
  { href: "/admin/inventory",  icon: Boxes,           label: "Inventory"            },
  { href: "/admin/banners",    icon: GalleryHorizontalEnd, label: "Banners"          },
  { href: "/admin/notifications", icon: Bell,         label: "Notifications"        },
  { href: "/admin/feedback",   icon: Star,            label: "Feedback"             },
  { href: "/admin/analytics",  icon: TrendingUp,      label: "Analytics"            },
  { href: "/admin/offers",     icon: Percent,         label: "Coupons"              },
  { href: "/admin/promotions", icon: Sparkles,        label: "Promotions"           },
  { href: "/admin/riders",     icon: Bike,            label: "Riders"               },
  { href: "/admin/staff",      icon: Users,           label: "Staff"                },
  { href: "/admin/settings",   icon: Settings,        label: "Settings"             },
  { href: "/admin/audit",      icon: ScrollText,      label: "Audit Log"            },
];

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);

  // Close drawer whenever the route changes (e.g. programmatic navigation)
  useEffect(() => { setOpen(false); }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/admin/login");
  };

  const currentPage = NAV_ITEMS.find(item =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
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

        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto overscroll-contain">
          {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active ? "bg-green-50 text-green-700 font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}>
                <Icon size={16} strokeWidth={active ? 2.5 : 2} />{label}
              </Link>
            );
          })}
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
        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto overscroll-contain">
          {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                  active ? "bg-green-50 text-green-700 font-bold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />{label}
              </Link>
            );
          })}
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
