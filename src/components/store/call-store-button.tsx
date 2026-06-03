"use client";

import { Phone } from "lucide-react";

// Store phone — read from public env var so it can be changed without redeploy
const STORE_PHONE = process.env.NEXT_PUBLIC_STORE_PHONE ?? "9876543210";

export function CallStoreButton() {
  return (
    <a
      href={`tel:+91${STORE_PHONE.replace(/\D/g, "")}`}
      className="fixed bottom-[72px] right-4 z-30 md:bottom-6 flex items-center gap-2 bg-white text-green-700 border border-green-200 shadow-lg shadow-green-600/10 px-3.5 py-2.5 rounded-2xl hover:bg-green-50 active:scale-95 transition-all group"
      aria-label="Call store"
    >
      <div className="w-7 h-7 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
        <Phone size={14} className="text-green-600" />
      </div>
      <span className="text-xs font-bold text-green-700 hidden sm:block group-hover:block transition-all">
        Call Store
      </span>
    </a>
  );
}
