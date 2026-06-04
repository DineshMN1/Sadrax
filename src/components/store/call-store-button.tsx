"use client";

import { Phone } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/store/cart";
import { cn } from "@/lib/utils";

const STORE_PHONE = process.env.NEXT_PUBLIC_STORE_PHONE ?? "9876543210";

export function CallStoreButton() {
  const [tapped, setTapped]   = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const hasCart = useCart(s => s.itemCount() > 0);

  return (
    <a
      href={`tel:+91${STORE_PHONE.replace(/\D/g, "")}`}
      onClick={() => { setTapped(true); setTimeout(() => setTapped(false), 600); }}
      aria-label="Call store"
      className={cn(
        "fixed right-4 z-30 md:bottom-6 group transition-all duration-300",
        // mounted guard prevents SSR/client position mismatch
        mounted && hasCart ? "bottom-36" : "bottom-20",
      )}
    >
      {/* Pulse rings — only show when no tapped */}
      {!tapped && (
        <>
          <span className="absolute inset-0 rounded-2xl bg-green-400 opacity-40 animate-pulse-ring pointer-events-none" />
          <span className="absolute inset-0 rounded-2xl bg-green-400 opacity-20 animate-pulse-ring pointer-events-none [animation-delay:0.7s]" />
        </>
      )}

      <div className={cn(
        "relative flex items-center gap-2.5",
        "bg-linear-to-br from-green-500 to-green-600",
        "text-white shadow-lg shadow-green-500/40",
        "px-4 py-2.5 rounded-2xl border border-green-400/30",
        "transition-all duration-200",
        tapped ? "scale-90" : "hover:scale-105 hover:shadow-xl hover:shadow-green-500/50"
      )}>
        <div className="w-7 h-7 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
          <Phone size={14} className="text-white" fill="white" />
        </div>
        <div className="hidden sm:block">
          <p className="text-[10px] font-semibold text-green-100 leading-none mb-0.5">Need help?</p>
          <p className="text-xs font-extrabold leading-none">Call Store</p>
        </div>
        <div className="sm:hidden">
          <p className="text-xs font-extrabold leading-none">Call</p>
        </div>
      </div>
    </a>
  );
}
