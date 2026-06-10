"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { Package, ChevronRight } from "lucide-react";

export function ProductRequestCard() {
  const { data: session, isPending } = useSession();

  if (isPending || !session) return null;

  return (
    <Link
      href="/product-request"
      className="flex items-center gap-3 bg-white border border-green-100 rounded-2xl shadow-sm px-4 py-3.5 hover:border-green-200 hover:shadow-md active:scale-[0.99] transition-all group"
    >
      <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
        <Package size={18} className="text-green-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900">Can&apos;t find a product?</p>
        <p className="text-xs text-gray-600 mt-0.5">Tell us what you need — we&apos;ll add it to the store</p>
      </div>
      <ChevronRight size={16} className="text-gray-300 group-hover:text-green-500 transition-colors shrink-0" />
    </Link>
  );
}
