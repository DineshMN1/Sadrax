"use client";

import dynamic from "next/dynamic";
import { Phone } from "lucide-react";

const STORE_PHONE = process.env.NEXT_PUBLIC_STORE_PHONE ?? "9876543210";

function StaticFallback() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="relative w-2 h-2">
          <span className="absolute inset-0 bg-green-500 rounded-full animate-pulse-ring" />
          <span className="absolute inset-0 bg-green-500 rounded-full" />
        </div>
        <div>
          <span className="text-sm font-extrabold text-gray-900 leading-none block">Sadrax</span>
          <span className="text-[10px] font-semibold text-gray-400 leading-none">by Malik Stores</span>
        </div>
      </div>
      <a
        href={`tel:+91${STORE_PHONE}`}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-xl"
        aria-label="Call store"
      >
        <Phone size={14} className="text-green-600" />
        <span className="text-xs font-bold text-green-700">Support</span>
      </a>
    </div>
  );
}

const GreetingInner = dynamic(() => import("./greeting-inner").then(m => ({ default: m.GreetingInner })), {
  ssr: false,
  loading: () => <StaticFallback />,
});

export function GreetingHeader() {
  return <GreetingInner />;
}
