"use client";

import Link from "next/link";
import { Package, ArrowRight } from "lucide-react";
import { useCart } from "@/store/cart";
import { useSession } from "@/lib/auth-client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const HIDE_ON = ["/product-request", "/cart", "/checkout", "/login", "/register", "/onboarding", "/complete-profile", "/categories", "/category", "/product"];

export function StickyProductRequestBar() {
  const itemCount           = useCart(s => s.itemCount());
  const { data: session }   = useSession();
  const pathname            = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  if (itemCount > 0) return null; // StickyCartBar takes this slot on mobile
  if (!session) return null;
  if (pathname === "/") return null;
  if (HIDE_ON.some(p => pathname === p || pathname.startsWith(p + "/"))) return null;

  return (
    // Mobile: bottom-16 (above bottom nav). Desktop: bottom-4 (no bottom nav).
    <div className="fixed bottom-16 md:bottom-4 left-0 right-0 z-30 px-4 pb-1.5 pointer-events-none">
      <Link
        href="/product-request"
        className="pointer-events-auto max-w-lg md:max-w-sm mx-auto md:ml-auto md:mr-8 flex items-center justify-between bg-white border border-green-200 text-gray-900 px-4 py-3 rounded-2xl shadow-xl shadow-black/10 hover:shadow-green-200/60 hover:border-green-300 active:scale-[0.98] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
            <Package size={17} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm font-extrabold leading-none text-gray-900">Can&apos;t find a product?</p>
            <p className="text-xs font-medium text-gray-600 leading-none mt-1">Request it — we&apos;ll add it to the store</p>
          </div>
        </div>
        <div className="w-7 h-7 bg-green-600 rounded-xl flex items-center justify-center shrink-0 ml-3">
          <ArrowRight size={13} className="text-white" />
        </div>
      </Link>
    </div>
  );
}
